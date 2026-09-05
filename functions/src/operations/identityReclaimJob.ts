// functions/src/operations/identityReclaimJob.ts
//
// reclaimIdentity's original single-batch
// approach refused outright past 440 combined writes, with no way to
// actually recover an account past that point. Replaced with a resumable
// bulkJobs.ts job, chunking the ownership migration the same way
// character/campaign deletion already do. The identity documents
// (identityRecoveryIndex/identitySecret/users.onboarded) transfer
// immediately in start, before the job is created — a second reclaim
// attempt on the same code while a job is still mid-flight then chains onto
// the new owner instead of racing it for the same campaigns/characters.
//
// The code lookup moved from the raw-code-keyed
// identityRecovery collection to the HMAC-hashed identityRecoveryIndex —
// same trust boundary claimCharacter already relies on, a hash match alone
// is proof the caller knew the real code.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import type { IdempotencyExecution } from "../shared/idempotency.js";
import {
  prepareBulkJob,
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  handleChunkFailure,
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

export interface StartIdentityReclaimJobResult {
  jobId: string;
  totalCount: number;
  role: "dm" | "player";
  profileTransferred: boolean;
}

export async function startIdentityReclaimJob(
  input: StartIdentityReclaimJobInput,
  callerUid: string,
  idempotencyKey: string | null,
  hmacSecret: string,
  idempotency: IdempotencyExecution<StartIdentityReclaimJobResult> | null = null
): Promise<StartIdentityReclaimJobResult> {
  const db = getFirestore();
  const code = input.code.trim();
  const hash = hashRecoveryCode(code, hmacSecret);

  const indexRef = db.collection("identityRecoveryIndex").doc(hash);
  const indexSnapshot = await indexRef.get();
  if (!indexSnapshot.exists) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const { uid: oldUid, role } = indexSnapshot.data() as {
    uid: string;
    role?: "dm" | "player";
  };
  if (oldUid === callerUid) {
    throw new HttpsError("failed-precondition", "This code is already registered to your account.");
  }

  // Reclaim is destructive: it moves the primary identity and invalidates the
  // old primary UID. Any remaining secondary link proves another device is
  // still connected to that primary, so the safe operation is another link,
  // not a reclaim. Repeat this server-side even if the client preflight already
  // selected a mode so the interface cannot be bypassed.
  const linkedDevicesSnapshot = await db
    .collection("userLinks")
    .where("primaryUid", "==", oldUid)
    .limit(1)
    .get();
  if (!linkedDevicesSnapshot.empty) {
    throw new HttpsError(
      "failed-precondition",
      "This account still has a linked device. Link this device instead of reclaiming."
    );
  }

  const plan = await computeOwnershipMigrationPlan(db, oldUid);

  // The public first-name profile belongs to the recovered identity, not to
  // the disposable anonymous-auth UID that previously represented it. Read
  // only the approved profile field and move it in the same batch as the
  // recovery secret and onboarding state so a successful reclaim cannot
  // complete with the original name stranded under oldUid.
  const oldProfileRef = db.collection("userProfiles").doc(oldUid);
  const oldProfileSnapshot = await oldProfileRef.get();
  const firstName = oldProfileSnapshot.exists ? oldProfileSnapshot.data()?.firstName : undefined;
  if (
    !oldProfileSnapshot.exists ||
    typeof firstName !== "string" ||
    firstName.length === 0 ||
    firstName.length > 50
  ) {
    throw new HttpsError(
      "failed-precondition",
      "The recovered account has no valid profile. No identity data was transferred."
    );
  }
  const recoveredFirstName = firstName;

  const preparedJob = prepareBulkJob(
    db,
    "identity-reclaim",
    callerUid,
    { oldUid, newUid: callerUid, campaigns: plan.campaigns } satisfies IdentityReclaimJobData,
    plan.totalWriteCount,
    idempotencyKey
  );

  const result: StartIdentityReclaimJobResult = {
    jobId: preparedJob.jobId,
    totalCount: plan.totalWriteCount,
    role: role ?? "player",
    profileTransferred: true,
  };

  if (idempotency) {
    return idempotency.runTransaction(async (transaction) => {
      transaction.update(indexRef, { uid: callerUid });
      transaction.set(db.collection("identitySecret").doc(callerUid), { code });
      transaction.delete(db.collection("identitySecret").doc(oldUid));
      transaction.set(db.collection("users").doc(callerUid), { onboarded: true }, { merge: true });
      transaction.set(db.collection("userProfiles").doc(callerUid), {
        firstName: recoveredFirstName,
      });
      transaction.delete(oldProfileRef);
      transaction.set(preparedJob.ref, preparedJob.record);
      return result;
    });
  }

  const transferBatch = db.batch();
  transferBatch.update(indexRef, { uid: callerUid });
  transferBatch.set(db.collection("identitySecret").doc(callerUid), { code });
  transferBatch.delete(db.collection("identitySecret").doc(oldUid));
  transferBatch.set(db.collection("users").doc(callerUid), { onboarded: true }, { merge: true });
  transferBatch.set(db.collection("userProfiles").doc(callerUid), {
    firstName: recoveredFirstName,
  });
  transferBatch.delete(oldProfileRef);
  transferBatch.set(preparedJob.ref, preparedJob.record);
  await transferBatch.commit();
  return result;
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
    if (done) {
      await completeJob(input.jobId, leaseId, writesInChunk);
    } else {
      await advanceJobCheckpoint(input.jobId, leaseId, String(index), writesInChunk);
    }

    return {
      done,
      processedCount: job.processedCount + writesInChunk,
      totalCount: job.totalCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    if (await handleChunkFailure(input.jobId, leaseId, job, error, message)) {
      return { done: false, processedCount: job.processedCount, totalCount: job.totalCount };
    }
    throw error;
  }
}
