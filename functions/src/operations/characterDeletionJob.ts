// functions/src/operations/characterDeletionJob.ts
//
// A resumable bulk job, replacing the client's "fits in
// one 440-document atomic batch, or the operation is refused" ceiling for
// character deletion (src/services/characterService.ts,
// src/utils/firestoreBatchDelete.ts) with a chunked, checkpointed job that
// can finish a deletion of any size.
//
// Mirrors the client's dependent-document set exactly: claimLog, xpProposals,
// the character's thread and its messages, the recoveryIndex entry, then the
// character document itself, deleted last so nothing is ever left pointing
// at a character that no longer exists. Unlike the client, the Recovery Code
// used to find the recoveryIndex entry is read from the character document
// server-side rather than accepted as a caller-supplied field. Only its
// HMAC-derived lookup ID is stored with the resumable job.

import { FieldPath, getFirestore, type Firestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import {
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  createBulkJob,
  handleChunkFailure,
  MAX_JOB_TOTAL_COUNT,
} from "../shared/bulkJobs.js";

const CHUNK_SIZE = 400;

type Phase =
  | "claimLog"
  | "xpProposals"
  | "messages"
  | "thread"
  | "recoveryIndex"
  | "characterSummary"
  | "character";
const PHASE_ORDER: readonly Phase[] = [
  "claimLog",
  "xpProposals",
  "messages",
  "thread",
  "recoveryIndex",
  "characterSummary",
  "character",
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
  hmacSecret: string
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
  const threadRef = campaignRef.collection("threads").doc(input.characterId);
  const recoveryRef = db.collection("recoveryIndex").doc(recoveryIndexId);
  const summaryRef = campaignRef.collection("characterSummaries").doc(input.characterId);

  const [
    claimLogCount,
    xpProposalsCount,
    messagesCount,
    threadSnapshot,
    recoverySnapshot,
    summarySnapshot,
  ] = await Promise.all([
    characterRef.collection("claimLog").count().get(),
    characterRef.collection("xpProposals").count().get(),
    threadRef.collection("messages").count().get(),
    threadRef.get(),
    recoveryRef.get(),
    summaryRef.get(),
  ]);

  const totalCount =
    claimLogCount.data().count +
    xpProposalsCount.data().count +
    messagesCount.data().count +
    (threadSnapshot.exists ? 1 : 0) +
    (recoverySnapshot.exists ? 1 : 0) +
    (summarySnapshot.exists ? 1 : 0) +
    1;

  if (totalCount > MAX_JOB_TOTAL_COUNT) {
    throw new HttpsError(
      "resource-exhausted",
      `This operation would affect more than ${MAX_JOB_TOTAL_COUNT} documents, which is too large to process safely right now.`
    );
  }

  const jobId = await createBulkJob(
    "character-deletion",
    callerUid,
    { campaignId: input.campaignId, characterId: input.characterId, recoveryIndexId },
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
    case "xpProposals":
    case "messages": {
      const collectionRef =
        checkpoint.phase === "messages"
          ? campaignRef.collection("threads").doc(characterId).collection("messages")
          : characterRef.collection(checkpoint.phase);

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
    case "thread": {
      const threadRef = campaignRef.collection("threads").doc(characterId);
      const threadSnapshot = await threadRef.get();
      if (threadSnapshot.exists) await threadRef.delete();
      return {
        processed: threadSnapshot.exists ? 1 : 0,
        nextCheckpoint: { phase: nextPhase("thread")!, cursor: null },
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
      return { processed: 1, nextCheckpoint: null };
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
      await completeJob(input.jobId, leaseId);
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
