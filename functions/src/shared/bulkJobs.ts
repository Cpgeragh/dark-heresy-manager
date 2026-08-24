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

export async function failJob(jobId: string, leaseId: string, error: string): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(BULK_JOBS_COLLECTION).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const job = snapshot.data() as BulkJobRecord;
    if (job.leaseOwner !== leaseId) return;
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
  }, { maxAttempts: 5 });
}
