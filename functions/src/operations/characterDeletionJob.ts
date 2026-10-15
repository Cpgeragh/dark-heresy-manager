// functions/src/operations/characterDeletionJob.ts
//
// A resumable bulk job that deletes a character in checkpointed chunks, so a
// deletion of any size can finish.
//
// The dependent documents are deleted in this order: claimLog, xpHistory,
// xpProposals, the recoveryIndex
// entry, the character summary, then the character document itself, so
// nothing is ever left pointing at a character that no longer exists. The
// last phase marks every copy of the character's chats closed. Sends are
// refused once the character is gone, so no new chat can open in between,
// and the messages stay. The Recovery Code used to find the recoveryIndex entry is read from
// the character document server-side rather than accepted as a
// caller-supplied field. Only its HMAC-derived lookup ID is stored with the
// resumable job.

import { FieldPath, getFirestore, type Firestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { closeChatCopiesPage } from "../shared/chatClosure.js";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import {
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  createBulkJob,
  handleChunkFailure,
  MAX_JOB_TOTAL_COUNT,
  prepareBulkJob,
} from "../shared/bulkJobs.js";
import type { IdempotencyExecution } from "../shared/idempotency.js";

const CHUNK_SIZE = 400;

type Phase =
  | "claimLog"
  | "xpHistory"
  | "xpProposals"
  | "recoveryIndex"
  | "characterSummary"
  | "character"
  | "chats";
const PHASE_ORDER: readonly Phase[] = [
  "claimLog",
  "xpHistory",
  "xpProposals",
  "recoveryIndex",
  "characterSummary",
  "character",
  "chats",
];

interface Checkpoint {
  phase: Phase;
  cursor: string | null;
}

function parseCheckpoint(raw: string | null): Checkpoint {
  if (!raw) return { phase: PHASE_ORDER[0], cursor: null };
  return JSON.parse(raw) as Checkpoint;
}

function nextPhase(phase: Phase): Phase | null {
  return PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1] ?? null;
}

export interface StartCharacterDeletionJobInput {
  campaignId: string;
  characterId: string;
}

export async function startCharacterDeletionJob(
  input: StartCharacterDeletionJobInput,
  callerUid: string,
  idempotencyKey: string | null,
  hmacSecret: string,
  idempotency: IdempotencyExecution<{ jobId: string; totalCount: number }> | null = null
): Promise<{ jobId: string; totalCount: number }> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (!(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))) {
    throw new HttpsError("permission-denied", "Only the campaign DM can delete a character.");
  }

  const characterSnapshot = await characterRef.get();
  if (!characterSnapshot.exists) {
    throw new HttpsError("not-found", "Character not found.");
  }

  const recoveryCode = characterSnapshot.data()?.recoveryCode as string | undefined;
  if (!recoveryCode) {
    throw new HttpsError(
      "failed-precondition",
      "This character has no usable Recovery Code, so its Recovery Index cannot be removed safely."
    );
  }

  const recoveryIndexId = hashRecoveryCode(recoveryCode, hmacSecret);
  const recoveryRef = db.collection("recoveryIndex").doc(recoveryIndexId);
  const summaryRef = campaignRef.collection("characterSummaries").doc(input.characterId);

  const [claimLogCount, xpHistoryCount, xpProposalsCount, recoverySnapshot, summarySnapshot] =
    await Promise.all([
      characterRef.collection("claimLog").count().get(),
      characterRef.collection("xpHistory").count().get(),
      characterRef.collection("xpProposals").count().get(),
      recoveryRef.get(),
      summaryRef.get(),
    ]);

  const totalCount =
    claimLogCount.data().count +
    xpHistoryCount.data().count +
    xpProposalsCount.data().count +
    (recoverySnapshot.exists ? 1 : 0) +
    (summarySnapshot.exists ? 1 : 0) +
    1;

  if (totalCount > MAX_JOB_TOTAL_COUNT) {
    throw new HttpsError(
      "resource-exhausted",
      `This operation would affect more than ${MAX_JOB_TOTAL_COUNT} documents, which is too large to process safely right now.`
    );
  }

  const jobData = {
    campaignId: input.campaignId,
    characterId: input.characterId,
    recoveryIndexId,
  };
  if (idempotency) {
    const prepared = prepareBulkJob(
      db,
      "character-deletion",
      callerUid,
      jobData,
      totalCount,
      idempotencyKey
    );
    return idempotency.runTransaction(async (transaction) => {
      transaction.set(prepared.ref, prepared.record);
      return { jobId: prepared.jobId, totalCount };
    });
  }

  const jobId = await createBulkJob(
    "character-deletion",
    callerUid,
    jobData,
    totalCount,
    idempotencyKey
  );

  return { jobId, totalCount };
}

async function processPhase(
  db: Firestore,
  campaignId: string,
  characterId: string,
  recoveryIndexId: string,
  checkpoint: Checkpoint
): Promise<{ processed: number; nextCheckpoint: Checkpoint | null }> {
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const characterRef = campaignRef.collection("characters").doc(characterId);

  switch (checkpoint.phase) {
    case "claimLog":
    case "xpHistory":
    case "xpProposals": {
      const collectionRef = characterRef.collection(checkpoint.phase);

      let pageQuery = collectionRef.orderBy(FieldPath.documentId()).limit(CHUNK_SIZE);
      if (checkpoint.cursor) pageQuery = pageQuery.startAfter(checkpoint.cursor);
      const snapshot = await pageQuery.get();

      if (snapshot.empty) {
        return {
          processed: 0,
          nextCheckpoint: { phase: nextPhase(checkpoint.phase)!, cursor: null },
        };
      }

      const batch = db.batch();
      snapshot.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
      await batch.commit();

      const isLastPage = snapshot.docs.length < CHUNK_SIZE;
      return {
        processed: snapshot.docs.length,
        nextCheckpoint: isLastPage
          ? { phase: nextPhase(checkpoint.phase)!, cursor: null }
          : { phase: checkpoint.phase, cursor: snapshot.docs[snapshot.docs.length - 1].id },
      };
    }
    case "recoveryIndex": {
      const recoveryRef = db.collection("recoveryIndex").doc(recoveryIndexId);
      const recoverySnapshot = await recoveryRef.get();
      if (recoverySnapshot.exists) await recoveryRef.delete();
      return {
        processed: recoverySnapshot.exists ? 1 : 0,
        nextCheckpoint: { phase: nextPhase("recoveryIndex")!, cursor: null },
      };
    }
    case "characterSummary": {
      const summaryRef = campaignRef.collection("characterSummaries").doc(characterId);
      const summarySnapshot = await summaryRef.get();
      if (summarySnapshot.exists) await summaryRef.delete();
      return {
        processed: summarySnapshot.exists ? 1 : 0,
        nextCheckpoint: { phase: nextPhase("characterSummary")!, cursor: null },
      };
    }
    case "character": {
      await characterRef.delete();
      return { processed: 1, nextCheckpoint: { phase: nextPhase("character")!, cursor: null } };
    }
    case "chats": {
      const { nextCursor } = await closeChatCopiesPage(
        db,
        { campaignId, characterId },
        checkpoint.cursor,
        CHUNK_SIZE
      );
      // Nothing is deleted, so these updates do not count toward the job's total.
      return {
        processed: 0,
        nextCheckpoint: nextCursor ? { phase: "chats", cursor: nextCursor } : null,
      };
    }
  }
}

export interface ProcessCharacterDeletionChunkInput {
  jobId: string;
}

export interface ProcessCharacterDeletionChunkResult {
  done: boolean;
  processedCount: number;
  totalCount: number;
}

export async function processCharacterDeletionChunk(
  input: ProcessCharacterDeletionChunkInput,
  callerUid: string
): Promise<ProcessCharacterDeletionChunkResult> {
  const { job, leaseId } = await acquireJobLease(input.jobId, callerUid);
  if (job.type !== "character-deletion") {
    throw new HttpsError("failed-precondition", "Job is not a character-deletion job.");
  }

  const db = getFirestore();
  const { campaignId, characterId, recoveryIndexId } = job.data as {
    campaignId: string;
    characterId: string;
    recoveryIndexId: string;
  };

  try {
    const campaignSnapshot = await db.collection("campaigns").doc(campaignId).get();
    if (
      !campaignSnapshot.exists ||
      !(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))
    ) {
      throw new HttpsError("permission-denied", "Only the campaign DM can delete this character.");
    }

    const checkpoint = parseCheckpoint(job.checkpoint);
    const { processed, nextCheckpoint } = await processPhase(
      db,
      campaignId,
      characterId,
      recoveryIndexId,
      checkpoint
    );

    if (nextCheckpoint === null) {
      await completeJob(input.jobId, leaseId, processed);
      return {
        done: true,
        processedCount: job.processedCount + processed,
        totalCount: job.totalCount,
      };
    }

    await advanceJobCheckpoint(input.jobId, leaseId, JSON.stringify(nextCheckpoint), processed);
    return {
      done: false,
      processedCount: job.processedCount + processed,
      totalCount: job.totalCount,
    };
  } catch (error) {
    const message = error instanceof HttpsError ? error.message : "Unexpected error.";
    if (await handleChunkFailure(input.jobId, leaseId, job, error, message)) {
      return { done: false, processedCount: job.processedCount, totalCount: job.totalCount };
    }
    throw error;
  }
}
