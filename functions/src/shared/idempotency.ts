// functions/src/shared/idempotency.ts
//
// Shared idempotency/replay protection for protected callables. Each active
// attempt owns a short lease. The operation's writes and cached result must be
// committed together through IdempotencyExecution.runTransaction, eliminating
// the ambiguous gap between a successful mutation and result persistence.

import {
  getFirestore,
  Timestamp,
  type Firestore,
  type ReadWriteTransactionOptions,
  type Transaction,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { randomUUID } from "node:crypto";

export const IDEMPOTENCY_COLLECTION = "idempotencyKeys";
export const IDEMPOTENCY_LEASE_MS = 60 * 1000;
export const IDEMPOTENCY_RESULT_RETENTION_MS = 24 * 60 * 60 * 1000;

interface InProgressRecord {
  status: "in-progress";
  leaseOwner: string;
  leaseExpiresAt: number;
  attemptCount: number;
  startedAt: number;
  updatedAt: number;
  expiresAt: Timestamp;
}

interface CompletedRecord<T> {
  status: "completed";
  result: T | null;
  completedAt: number;
  expiresAt: Timestamp;
}

export interface IdempotencyExecution<T> {
  runTransaction(
    handler: (transaction: Transaction) => Promise<T>,
    options?: ReadWriteTransactionOptions
  ): Promise<T>;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function malformedRecord(): HttpsError {
  return new HttpsError("internal", "The operation's retry record is invalid.");
}

async function releaseOwnedLease(db: Firestore, key: string, leaseOwner: string): Promise<void> {
  const ref = db.collection(IDEMPOTENCY_COLLECTION).doc(key);
  await db.runTransaction(
    async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return;
      const data = snapshot.data();
      if (data?.status === "in-progress" && data.leaseOwner === leaseOwner) {
        transaction.delete(ref);
      }
    },
    { maxAttempts: 5 }
  );
}

export async function withIdempotency<T>(
  key: string,
  handler: (execution: IdempotencyExecution<T>) => Promise<T>
): Promise<T> {
  const db = getFirestore();
  const ref = db.collection(IDEMPOTENCY_COLLECTION).doc(key);
  const leaseOwner = randomUUID();

  const claim = await db.runTransaction(
    async (transaction) => {
      const snapshot = await transaction.get(ref);
      const now = Date.now();

      if (snapshot.exists) {
        const data = snapshot.data();
        if (data?.status === "completed") {
          const completedAt = finiteNumber(data.completedAt);
          if (completedAt === null) throw malformedRecord();
          if (now - completedAt < IDEMPOTENCY_RESULT_RETENTION_MS) {
            if (!(data.expiresAt instanceof Timestamp)) {
              transaction.update(ref, {
                expiresAt: Timestamp.fromMillis(completedAt + IDEMPOTENCY_RESULT_RETENTION_MS),
              });
            }
            return { kind: "replay" as const, result: data.result as T };
          }
        } else if (data?.status === "in-progress") {
          const startedAt = finiteNumber(data.startedAt);
          if (startedAt === null) throw malformedRecord();
          const recordedLeaseExpiry = finiteNumber(data.leaseExpiresAt);
          const leaseExpiresAt = recordedLeaseExpiry ?? startedAt + IDEMPOTENCY_LEASE_MS;
          if (leaseExpiresAt > now) {
            throw new HttpsError("aborted", "This request is already being processed.", {
              retryAfterMs: leaseExpiresAt - now,
            });
          }
        } else {
          throw malformedRecord();
        }
      }

      const previousData = snapshot.data();
      const previousStartedAt = finiteNumber(previousData?.startedAt);
      const previousAttemptCount = finiteNumber(previousData?.attemptCount);
      const record: InProgressRecord = {
        status: "in-progress",
        leaseOwner,
        leaseExpiresAt: now + IDEMPOTENCY_LEASE_MS,
        attemptCount: (previousAttemptCount ?? (snapshot.exists ? 1 : 0)) + 1,
        startedAt: previousStartedAt ?? now,
        updatedAt: now,
        expiresAt: Timestamp.fromMillis(now + IDEMPOTENCY_RESULT_RETENTION_MS),
      };
      transaction.set(ref, record);
      return { kind: "claimed" as const };
    },
    { maxAttempts: 5 }
  );

  if (claim.kind === "replay") return claim.result;

  let completionCommitted = false;
  let transactionStarted = false;
  const execution: IdempotencyExecution<T> = {
    async runTransaction(transactionHandler, options = { maxAttempts: 5 }) {
      if (transactionStarted) {
        throw new HttpsError("internal", "An idempotent operation may commit only once.");
      }
      transactionStarted = true;
      const result = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const data = snapshot.data();
        if (!snapshot.exists || data?.status !== "in-progress" || data.leaseOwner !== leaseOwner) {
          throw new HttpsError("aborted", "This operation's processing lease has expired.");
        }

        const value = await transactionHandler(transaction);
        const completedAt = Date.now();
        const completed: CompletedRecord<T> = {
          status: "completed",
          result: value ?? null,
          completedAt,
          expiresAt: Timestamp.fromMillis(completedAt + IDEMPOTENCY_RESULT_RETENTION_MS),
        };
        transaction.set(ref, completed);
        return value;
      }, options);
      completionCommitted = true;
      return result;
    },
  };

  try {
    const result = await handler(execution);
    if (!completionCommitted) {
      throw new HttpsError(
        "internal",
        "The idempotent operation returned without committing its result."
      );
    }
    return result;
  } catch (error) {
    if (!completionCommitted) {
      try {
        await releaseOwnedLease(db, key, leaseOwner);
      } catch (cleanupError) {
        logger.warn("Failed to release an idempotency lease after an operation error.", {
          key,
          cleanupError,
        });
      }
    }
    throw error;
  }
}

export function runOperationTransaction<T>(
  db: Firestore,
  execution: IdempotencyExecution<T> | null,
  handler: (transaction: Transaction) => Promise<T>,
  options: ReadWriteTransactionOptions = { maxAttempts: 5 }
): Promise<T> {
  return execution
    ? execution.runTransaction(handler, options)
    : db.runTransaction(handler, options);
}
