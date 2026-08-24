// functions/src/operations/identityReclaimJob.ts
//
// Stage 3, gap-audit item 12: reclaimIdentity's original single-batch
// approach refused outright past 440 combined writes, with no way to
// actually recover an account past that point. Replaced with a resumable
// bulkJobs.ts job, chunking the ownership migration the same way
// character/campaign deletion already do. The identity documents
// (identityRecovery/identitySecret/users.onboarded) transfer immediately in
// start, before the job is created — a second reclaim attempt on the same
// code while a job is still mid-flight then chains onto the new owner
// instead of racing it for the same campaigns/characters.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  createBulkJob,
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  failJob,
} from "../shared/bulkJobs.js";
import {
  computeOwnershipMigrationPlan,
  migrateCampaignOwnership,
  type CampaignMigrationEntry,
} from "../shared/identityMigration.js";

// Leaves headroom below Firestore's 500-writes-per-batch hard limit: a single
// campaign can cost up to 101 writes (1 campaign doc + up to 100 characters),
// so stopping the loop at 300 guarantees any one chunk's batch stays at or
// below 300 + 101 = 401.
const CHUNK_WRITE_BUDGET = 300;

interface IdentityReclaimJobData {
  oldUid: string;
  newUid: string;
  campaigns: CampaignMigrationEntry[];
}

export interface StartIdentityReclaimJobInput {
  code: string;
}

export interface ProcessIdentityReclaimChunkInput {
  jobId: string;
}

export interface ProcessIdentityReclaimChunkResult {
  done: boolean;
  processedCount: number;
  totalCount: number;
}

export async function startIdentityReclaimJob(
  input: StartIdentityReclaimJobInput,
  callerUid: string,
  idempotencyKey: string | null
): Promise<{ jobId: string; totalCount: number; role: "dm" | "player" }> {
  const db = getFirestore();
  const code = input.code.trim();

  const recoverySnapshot = await db.collection("identityRecovery").doc(code).get();
  if (!recoverySnapshot.exists) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const { uid: oldUid, role } = recoverySnapshot.data() as {
    uid: string;
    role?: "dm" | "player";
  };
  if (oldUid === callerUid) {
    throw new HttpsError(
      "failed-precondition",
      "This code is already registered to your account."
    );
  }

  const secretSnapshot = await db.collection("identitySecret").doc(oldUid).get();
  if (!secretSnapshot.exists || secretSnapshot.data()?.code !== code) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const plan = await computeOwnershipMigrationPlan(db, oldUid);

  const transferBatch = db.batch();
  transferBatch.update(db.collection("identityRecovery").doc(code), { uid: callerUid });
  transferBatch.set(db.collection("identitySecret").doc(callerUid), { code });
  transferBatch.delete(db.collection("identitySecret").doc(oldUid));
  transferBatch.set(db.collection("users").doc(callerUid), { onboarded: true }, { merge: true });
  await transferBatch.commit();

  const jobId = await createBulkJob(
    "identity-reclaim",
    callerUid,
    { oldUid, newUid: callerUid, campaigns: plan.campaigns } satisfies IdentityReclaimJobData,
    plan.totalWriteCount,
    idempotencyKey
  );

  return { jobId, totalCount: plan.totalWriteCount, role: role ?? "player" };
}

export async function processIdentityReclaimChunk(
  input: ProcessIdentityReclaimChunkInput,
  callerUid: string
): Promise<ProcessIdentityReclaimChunkResult> {
  const db = getFirestore();
  const { job, leaseId } = await acquireJobLease(input.jobId, callerUid);
  if (job.type !== "identity-reclaim") {
    throw new HttpsError("failed-precondition", "Job is not an identity-reclaim job.");
  }
  const { oldUid, newUid, campaigns } = job.data as unknown as IdentityReclaimJobData;
  const startIndex = job.checkpoint ? Number(job.checkpoint) : 0;

  try {
    const batch = db.batch();
    let writesInChunk = 0;
    let index = startIndex;

    while (index < campaigns.length && writesInChunk < CHUNK_WRITE_BUDGET) {
      writesInChunk += await migrateCampaignOwnership(db, batch, campaigns[index], oldUid, newUid);
      index += 1;
    }

    if (writesInChunk > 0) {
      await batch.commit();
    }

    const done = index >= campaigns.length;
    await advanceJobCheckpoint(input.jobId, leaseId, done ? null : String(index), writesInChunk);

    if (done) {
      await completeJob(input.jobId, leaseId);
    }

    return {
      done,
      processedCount: job.processedCount + writesInChunk,
      totalCount: job.totalCount,
    };
  } catch (error) {
    await failJob(input.jobId, leaseId, error instanceof Error ? error.message : "Unknown error.");
    throw error;
  }
}
