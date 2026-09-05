// functions/src/operations/campaignDeletionJob.ts
//
// A resumable bulk job, replacing the client's "fits in
// one 440-document atomic batch, or the operation is refused" ceiling for
// campaign deletion (src/services/campaignService.ts's
// buildCampaignDeletionPlan) with a chunked, checkpointed job that can
// finish a deletion of any size.
//
// Mirrors the client's dependent-document tree exactly: every character's
// claimLog and xpProposals subcollections plus its derived recoveryIndex
// entry, every thread's messages, every custom item's versions, the flat
// sessions and member-safe sessionSummaries collections, then the
// character/thread/customItem documents
// themselves, then the campaign document last. Like the client, the whole
// deletion is refused upfront if any character lacks a valid-format
// Recovery Code, since that's the only way its recoveryIndex entry can be
// found and removed safely.

import {
  FieldPath,
  getFirestore,
  type CollectionReference,
  type Firestore,
} from "firebase-admin/firestore";
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
const RECOVERY_CODE_PATTERN = /^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

type Phase =
  | "characterClaimLogs"
  | "characterXpProposals"
  | "characterRecoveryIndex"
  | "characterSummaries"
  | "characters"
  | "sessions"
  | "sessionSummaries"
  | "threadMessages"
  | "threads"
  | "customItemVersions"
  | "customItems"
  | "campaign";

const PHASE_ORDER: readonly Phase[] = [
  "characterClaimLogs",
  "characterXpProposals",
  "characterRecoveryIndex",
  "characterSummaries",
  "characters",
  "sessions",
  "sessionSummaries",
  "threadMessages",
  "threads",
  "customItemVersions",
  "customItems",
  "campaign",
];

interface Checkpoint {
  phase: Phase;
  parentCursor: string | null;
  cursor: string | null;
}

function parseCheckpoint(raw: string | null): Checkpoint {
  if (!raw) return { phase: PHASE_ORDER[0], parentCursor: null, cursor: null };
  return JSON.parse(raw) as Checkpoint;
}

function nextPhase(phase: Phase): Phase | null {
  return PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1] ?? null;
}

export interface StartCampaignDeletionJobInput {
  campaignId: string;
}

export async function startCampaignDeletionJob(
  input: StartCampaignDeletionJobInput,
  callerUid: string,
  idempotencyKey: string | null,
  hmacSecret: string
): Promise<{ jobId: string; totalCount: number }> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (!(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))) {
    throw new HttpsError("permission-denied", "Only the campaign DM can delete a campaign.");
  }

  const charactersSnapshot = await campaignRef.collection("characters").get();
  const characters = charactersSnapshot.docs;

  for (const character of characters) {
    const code = character.data().recoveryCode;
    if (typeof code !== "string" || !RECOVERY_CODE_PATTERN.test(code)) {
      throw new HttpsError(
        "failed-precondition",
        "At least one character has no usable Recovery Code, so its Recovery Index cannot be removed safely."
      );
    }
  }

  const [claimLogCounts, xpProposalCounts, recoverySnapshots] = await Promise.all([
    Promise.all(characters.map((c) => c.ref.collection("claimLog").count().get())),
    Promise.all(characters.map((c) => c.ref.collection("xpProposals").count().get())),
    Promise.all(
      characters.map((c) =>
        db
          .collection("recoveryIndex")
          .doc(hashRecoveryCode(c.data().recoveryCode as string, hmacSecret))
          .get()
      )
    ),
  ]);

  const threadsSnapshot = await campaignRef.collection("threads").get();
  const threads = threadsSnapshot.docs;
  const messageCounts = await Promise.all(
    threads.map((t) => t.ref.collection("messages").count().get())
  );

  const customItemsSnapshot = await campaignRef.collection("customItems").get();
  const customItems = customItemsSnapshot.docs;
  const versionCounts = await Promise.all(
    customItems.map((ci) => ci.ref.collection("versions").count().get())
  );

  const sessionsCount = await campaignRef.collection("sessions").count().get();
  const sessionSummariesCount = await campaignRef.collection("sessionSummaries").count().get();
  const characterSummariesCount = await campaignRef.collection("characterSummaries").count().get();

  const sum = (counts: { data: () => { count: number } }[]) =>
    counts.reduce((total, c) => total + c.data().count, 0);

  const totalCount =
    characters.length +
    sum(claimLogCounts) +
    sum(xpProposalCounts) +
    recoverySnapshots.filter((s) => s.exists).length +
    characterSummariesCount.data().count +
    threads.length +
    sum(messageCounts) +
    customItems.length +
    sum(versionCounts) +
    sessionsCount.data().count +
    sessionSummariesCount.data().count +
    1;

  if (totalCount > MAX_JOB_TOTAL_COUNT) {
    throw new HttpsError(
      "resource-exhausted",
      `This operation would affect more than ${MAX_JOB_TOTAL_COUNT} documents, which is too large to process safely right now.`
    );
  }

  const jobId = await createBulkJob(
    "campaign-deletion",
    callerUid,
    { campaignId: input.campaignId },
    totalCount,
    idempotencyKey
  );

  return { jobId, totalCount };
}

async function deleteFlatPage(
  collectionRef: CollectionReference,
  checkpoint: Checkpoint,
  phase: Phase
): Promise<{ processed: number; nextCheckpoint: Checkpoint }> {
  let pageQuery = collectionRef.orderBy(FieldPath.documentId()).limit(CHUNK_SIZE);
  if (checkpoint.cursor) pageQuery = pageQuery.startAfter(checkpoint.cursor);
  const page = await pageQuery.get();

  if (page.empty) {
    return {
      processed: 0,
      nextCheckpoint: { phase: nextPhase(phase)!, parentCursor: null, cursor: null },
    };
  }

  const batch = collectionRef.firestore.batch();
  page.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
  await batch.commit();

  const isLastPage = page.docs.length < CHUNK_SIZE;
  return {
    processed: page.docs.length,
    nextCheckpoint: isLastPage
      ? { phase: nextPhase(phase)!, parentCursor: null, cursor: null }
      : { phase, parentCursor: null, cursor: page.docs[page.docs.length - 1].id },
  };
}

async function sweepNestedPhase(
  parentCollection: CollectionReference,
  childCollectionName: string,
  checkpoint: Checkpoint,
  phase: Phase
): Promise<{ processed: number; nextCheckpoint: Checkpoint }> {
  let parentId = checkpoint.parentCursor;
  if (parentId === null) {
    const firstParent = await parentCollection.orderBy(FieldPath.documentId()).limit(1).get();
    if (firstParent.empty) {
      return {
        processed: 0,
        nextCheckpoint: { phase: nextPhase(phase)!, parentCursor: null, cursor: null },
      };
    }
    parentId = firstParent.docs[0].id;
  }

  const childCollection = parentCollection.doc(parentId).collection(childCollectionName);
  let pageQuery = childCollection.orderBy(FieldPath.documentId()).limit(CHUNK_SIZE);
  if (checkpoint.cursor) pageQuery = pageQuery.startAfter(checkpoint.cursor);
  const page = await pageQuery.get();

  if (!page.empty) {
    const batch = parentCollection.firestore.batch();
    page.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
    await batch.commit();
  }

  const isLastPage = page.docs.length < CHUNK_SIZE;
  if (!isLastPage) {
    return {
      processed: page.docs.length,
      nextCheckpoint: { phase, parentCursor: parentId, cursor: page.docs[page.docs.length - 1].id },
    };
  }

  const nextParentSnapshot = await parentCollection
    .orderBy(FieldPath.documentId())
    .startAfter(parentId)
    .limit(1)
    .get();

  if (nextParentSnapshot.empty) {
    return {
      processed: page.docs.length,
      nextCheckpoint: { phase: nextPhase(phase)!, parentCursor: null, cursor: null },
    };
  }

  return {
    processed: page.docs.length,
    nextCheckpoint: { phase, parentCursor: nextParentSnapshot.docs[0].id, cursor: null },
  };
}

async function processRecoveryIndexPage(
  db: Firestore,
  charactersCollection: CollectionReference,
  checkpoint: Checkpoint,
  hmacSecret: string
): Promise<{ processed: number; nextCheckpoint: Checkpoint }> {
  let pageQuery = charactersCollection.orderBy(FieldPath.documentId()).limit(CHUNK_SIZE);
  if (checkpoint.cursor) pageQuery = pageQuery.startAfter(checkpoint.cursor);
  const page = await pageQuery.get();

  if (page.empty) {
    return {
      processed: 0,
      nextCheckpoint: {
        phase: nextPhase("characterRecoveryIndex")!,
        parentCursor: null,
        cursor: null,
      },
    };
  }

  const codes = page.docs
    .map((docSnapshot) => docSnapshot.data().recoveryCode as string | undefined)
    .filter((code): code is string => typeof code === "string");
  const recoveryRefs = codes.map((code) =>
    db.collection("recoveryIndex").doc(hashRecoveryCode(code, hmacSecret))
  );
  const recoverySnapshots = await Promise.all(recoveryRefs.map((ref) => ref.get()));
  const existingRefs = recoveryRefs.filter((_, index) => recoverySnapshots[index].exists);

  if (existingRefs.length > 0) {
    const batch = db.batch();
    existingRefs.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  const isLastPage = page.docs.length < CHUNK_SIZE;
  return {
    processed: existingRefs.length,
    nextCheckpoint: isLastPage
      ? { phase: nextPhase("characterRecoveryIndex")!, parentCursor: null, cursor: null }
      : {
          phase: "characterRecoveryIndex",
          parentCursor: null,
          cursor: page.docs[page.docs.length - 1].id,
        },
  };
}

async function processPhase(
  db: Firestore,
  campaignId: string,
  checkpoint: Checkpoint,
  hmacSecret: string
): Promise<{ processed: number; nextCheckpoint: Checkpoint | null }> {
  const campaignRef = db.collection("campaigns").doc(campaignId);

  switch (checkpoint.phase) {
    case "characterClaimLogs":
      return sweepNestedPhase(
        campaignRef.collection("characters"),
        "claimLog",
        checkpoint,
        "characterClaimLogs"
      );
    case "characterXpProposals":
      return sweepNestedPhase(
        campaignRef.collection("characters"),
        "xpProposals",
        checkpoint,
        "characterXpProposals"
      );
    case "characterRecoveryIndex":
      return processRecoveryIndexPage(
        db,
        campaignRef.collection("characters"),
        checkpoint,
        hmacSecret
      );
    case "characterSummaries":
      return deleteFlatPage(
        campaignRef.collection("characterSummaries"),
        checkpoint,
        "characterSummaries"
      );
    case "characters":
      return deleteFlatPage(campaignRef.collection("characters"), checkpoint, "characters");
    case "sessions":
      return deleteFlatPage(campaignRef.collection("sessions"), checkpoint, "sessions");
    case "sessionSummaries":
      return deleteFlatPage(
        campaignRef.collection("sessionSummaries"),
        checkpoint,
        "sessionSummaries"
      );
    case "threadMessages":
      return sweepNestedPhase(
        campaignRef.collection("threads"),
        "messages",
        checkpoint,
        "threadMessages"
      );
    case "threads":
      return deleteFlatPage(campaignRef.collection("threads"), checkpoint, "threads");
    case "customItemVersions":
      return sweepNestedPhase(
        campaignRef.collection("customItems"),
        "versions",
        checkpoint,
        "customItemVersions"
      );
    case "customItems":
      return deleteFlatPage(campaignRef.collection("customItems"), checkpoint, "customItems");
    case "campaign":
      await campaignRef.delete();
      return { processed: 1, nextCheckpoint: null };
  }
}

export interface ProcessCampaignDeletionChunkInput {
  jobId: string;
}

export interface ProcessCampaignDeletionChunkResult {
  done: boolean;
  processedCount: number;
  totalCount: number;
}

export async function processCampaignDeletionChunk(
  input: ProcessCampaignDeletionChunkInput,
  callerUid: string,
  hmacSecret: string
): Promise<ProcessCampaignDeletionChunkResult> {
  const { job, leaseId } = await acquireJobLease(input.jobId, callerUid);
  if (job.type !== "campaign-deletion") {
    throw new HttpsError("failed-precondition", "Job is not a campaign-deletion job.");
  }

  const db = getFirestore();
  const { campaignId } = job.data as { campaignId: string };

  try {
    const campaignSnapshot = await db.collection("campaigns").doc(campaignId).get();
    if (
      !campaignSnapshot.exists ||
      !(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))
    ) {
      throw new HttpsError("permission-denied", "Only the campaign DM can delete this campaign.");
    }

    const checkpoint = parseCheckpoint(job.checkpoint);
    const { processed, nextCheckpoint } = await processPhase(
      db,
      campaignId,
      checkpoint,
      hmacSecret
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
