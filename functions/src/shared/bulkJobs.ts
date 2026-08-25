// functions/src/shared/bulkJobs.ts
//
// Stage 3.4: shared resumable bulk-job infrastructure. A job record tracks
// progress/checkpoint state in Firestore; the client repeatedly calls a
// "process next chunk" callable until the job reports done, resuming from
// the last checkpoint if a call drops mid-way. Retry-safe via a lease: only
// one in-flight chunk-processing call can hold a job's lease at a time
// (protects against a double-click or two tabs racing the same job), and a
// fresh lease ID per acquisition stops a delayed, zombie call from an
// earlier holder writing after a newer holder has taken over.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { randomUUID } from "node:crypto";
import { IDEMPOTENCY_COLLECTION } from "./idempotency.js";

const BULK_JOBS_COLLECTION = "bulkJobs";
const LEASE_DURATION_MS = 60 * 1000;
// A job untouched this long since creation is treated as abandoned the next
// time anything tries to access it. Lazy, access-triggered expiry only, not
// a proactive sweep — a real sweep (scheduled function or Firestore TTL
// policy) needs configuring against the actual deployed project, which is
// out of scope until this app is actually deployed.
const JOB_EXPIRY_MS = 24 * 60 * 60 * 1000;

export type BulkJobStatus = "pending" | "running" | "completed" | "failed";

export interface BulkJobRecord {
  type: string;
  status: BulkJobStatus;
  actorUid: string;
  data: Record<string, unknown>;
  totalCount: number;
  processedCount: number;
  checkpoint: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: number | null;
  error: string | null;
  idempotencyKey: string | null;
  retryCount: number;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
}

export async function createBulkJob(
  type: string,
  actorUid: string,
  data: Record<string, unknown>,
  totalCount: number,
  idempotencyKey: string | null
): Promise<string> {
  const db = getFirestore();
  const jobId = randomUUID();
  const now = Date.now();
  const record: BulkJobRecord = {
    type,
    status: "pending",
    actorUid,
    data,
    totalCount,
    processedCount: 0,
    checkpoint: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    error: null,
    idempotencyKey,
    retryCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(BULK_JOBS_COLLECTION).doc(jobId).set(record);
  return jobId;
}

export async function acquireJobLease(
  jobId: string,
  actorUid: string
): Promise<{ job: BulkJobRecord; leaseId: string }> {
  const db = getFirestore();
  const ref = db.collection(BULK_JOBS_COLLECTION).doc(jobId);
  const leaseId = randomUUID();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw new HttpsError("not-found", "Job not found.");
    }
    const job = snapshot.data() as BulkJobRecord;

    if (job.actorUid !== actorUid) {
      throw new HttpsError("permission-denied", "This job belongs to a different caller.");
    }
    if (job.status === "completed" || job.status === "failed") {
      throw new HttpsError("failed-precondition", `Job already ${job.status}.`);
    }

    const now = Date.now();

    if (now - job.createdAt > JOB_EXPIRY_MS) {
      markJobFailedInTransaction(db, transaction, ref, job, "Job expired without completing.");
      throw new HttpsError(
        "failed-precondition",
        "This job expired without completing. Start a new one."
      );
    }

    const leaseHeld = job.leaseExpiresAt !== null && job.leaseExpiresAt > now;
    if (leaseHeld) {
      throw new HttpsError("aborted", "This job is already being processed.");
    }

    transaction.update(ref, {
      status: "running",
      leaseOwner: leaseId,
      leaseExpiresAt: now + LEASE_DURATION_MS,
      updatedAt: now,
    });

    return { job, leaseId };
  }, { maxAttempts: 5 });
}

export async function advanceJobCheckpoint(
  jobId: string,
  leaseId: string,
  checkpoint: string | null,
  processedIncrement: number
): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(BULK_JOBS_COLLECTION).doc(jobId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const job = snapshot.data() as BulkJobRecord;
    if (job.leaseOwner !== leaseId) {
      throw new HttpsError("aborted", "Lease no longer held; another call took over this job.");
    }

    transaction.update(ref, {
      checkpoint,
      processedCount: FieldValue.increment(processedIncrement),
      leaseOwner: null,
      leaseExpiresAt: null,
      retryCount: 0,
      lastError: null,
      updatedAt: Date.now(),
    });
  }, { maxAttempts: 5 });
}

export async function completeJob(jobId: string, leaseId: string): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(BULK_JOBS_COLLECTION).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const job = snapshot.data() as BulkJobRecord;
    if (job.leaseOwner !== leaseId) return;
    transaction.update(ref, {
      status: "completed",
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: Date.now(),
    });
  }, { maxAttempts: 5 });
}

// Shared by failJob and acquireJobLease's expiry check: marks a job failed
// and clears its recorded idempotency key (if any) within an already-open
// transaction, so a future start call with the same deterministic key
// creates a genuinely fresh job instead of replaying the dead one.
function markJobFailedInTransaction(
  db: FirebaseFirestore.Firestore,
  transaction: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference,
  job: BulkJobRecord,
  error: string
): void {
  transaction.update(ref, {
    status: "failed",
    error,
    leaseOwner: null,
    leaseExpiresAt: null,
    updatedAt: Date.now(),
  });
  if (job.idempotencyKey) {
    transaction.delete(db.collection(IDEMPOTENCY_COLLECTION).doc(job.idempotencyKey));
  }
}

export async function failJob(jobId: string, leaseId: string, error: string): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(BULK_JOBS_COLLECTION).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const job = snapshot.data() as BulkJobRecord;
    if (job.leaseOwner !== leaseId) return;
    markJobFailedInTransaction(db, transaction, ref, job, error);
  }, { maxAttempts: 5 });
}

// A chunk failure is retried automatically, rather than permanently failing
// the job, when it looks transient (a Firestore/gRPC blip) and the job
// hasn't already used up its retry budget. Everything else, a deliberate
// HttpsError like permission-denied/not-found/failed-precondition, or any
// error with no recognisable code, is treated as permanent, matching the
// behaviour before retries existed.
export const MAX_CHUNK_RETRIES = 5;

// Numeric: raw @google-cloud/firestore/gRPC errors (batch.commit, transactions,
// plain reads) carry a numeric status code. String: HttpsError uses the
// equivalent kebab-case names for the same statuses.
const RETRIABLE_NUMERIC_CODES = new Set([4, 10, 13, 14]); // DEADLINE_EXCEEDED, ABORTED, INTERNAL, UNAVAILABLE
const RETRIABLE_STRING_CODES = new Set(["deadline-exceeded", "aborted", "internal", "unavailable"]);

export function isRetriableChunkError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "number") return RETRIABLE_NUMERIC_CODES.has(code);
  if (typeof code === "string") return RETRIABLE_STRING_CODES.has(code);
  return false;
}

async function releaseLeaseForRetry(jobId: string, leaseId: string, error: string): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(BULK_JOBS_COLLECTION).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const current = snapshot.data() as BulkJobRecord;
    if (current.leaseOwner !== leaseId) return;
    transaction.update(ref, {
      retryCount: FieldValue.increment(1),
      lastError: error,
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: Date.now(),
    });
  }, { maxAttempts: 5 });
}

/**
 * Called from a process*Chunk operation's catch block in place of calling
 * failJob directly. A retriable-looking error under the retry cap releases
 * the lease and leaves the job resumable (checkpoint untouched) instead of
 * failing it, returning true so the caller can return its normal in-progress
 * result rather than throwing. Anything else, a non-retriable error or one
 * that's exhausted the cap, permanently fails the job via failJob (unchanged)
 * and returns false so the caller rethrows exactly as before this existed.
 */
export async function handleChunkFailure(
  jobId: string,
  leaseId: string,
  job: BulkJobRecord,
  error: unknown,
  message: string
): Promise<boolean> {
  if (isRetriableChunkError(error) && job.retryCount + 1 < MAX_CHUNK_RETRIES) {
    await releaseLeaseForRetry(jobId, leaseId, message);
    return true;
  }

  await failJob(jobId, leaseId, message);
  return false;
}
