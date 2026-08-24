// functions/src/operations/customItemMutationJob.ts
//
// Stage 3.4: the third resumable bulk job, replacing the client's "scans
// every character, refused above charactersPerCampaign (100)" ceiling for
// custom-item propagation and removal (src/services/customItemService.ts)
// with a chunked, checkpointed job that can finish a sweep of any size.
//
// One job type covers all four client entry points, since they share
// identical mechanics (scan characters, compute a per-character mutation,
// apply it) and differ only in which mutation runs and whether an item-level
// transition happens first:
//   - "publish-and-update": publish the target version, then propagate it
//   - "update": propagate an already-resolved version, no publish step
//   - "remove": strip every copy, no item-level change
//   - "archive-and-remove": archive the item, then strip every copy
//
// The item-level transition (publish or archive) is always one or two small
// document writes regardless of campaign size, so it happens once,
// synchronously, in start — not chunked. Unlike the two deletion jobs this
// is a flat, single-level sweep (no nested subcollections), so the
// checkpoint is just a character-id cursor. totalCount/processedCount count
// characters *scanned* (an exact, cheap aggregate count, consistent
// denominator/numerator), not characters actually mutated — Firestore has
// no aggregate query for "characters whose gear array contains X", so an
// exact mutated-count would need the same full-collection read the client
// already does today, which is exactly the cost this job exists to avoid
// paying synchronously. Each chunk's result reports mutatedThisChunk for
// visibility into real progress.

import { FieldPath, FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  createBulkJob,
  failJob,
} from "../shared/bulkJobs.js";
import {
  buildCharacterCopyRemoval,
  buildCharacterCopyUpdate,
  type CharacterItemArrays,
  type CustomItemCategory,
} from "../shared/customItemCopyMutation.js";

const CHUNK_SIZE = 400;

export type CustomItemMutationMode =
  | "publish-and-update"
  | "update"
  | "remove"
  | "archive-and-remove";

interface Checkpoint {
  cursor: string | null;
}

function parseCheckpoint(raw: string | null): Checkpoint {
  if (!raw) return { cursor: null };
  return JSON.parse(raw) as Checkpoint;
}

export interface StartCustomItemMutationJobInput {
  campaignId: string;
  customItemId: string;
  mode: CustomItemMutationMode;
  versionId?: string;
  actorUserId: string;
}

async function publishTargetVersion(
  db: Firestore,
  itemRef: FirebaseFirestore.DocumentReference,
  requestedVersionId: string | undefined,
  actorUserId: string
): Promise<string> {
  return db.runTransaction(async (transaction) => {
    const itemSnapshot = await transaction.get(itemRef);
    if (!itemSnapshot.exists) throw new HttpsError("not-found", "Custom item not found.");
    const item = itemSnapshot.data() as {
      draftVersionId?: string | null;
      latestVersionId?: string | null;
    };
    const targetVersionId = requestedVersionId ?? item.draftVersionId ?? item.latestVersionId;
    if (!targetVersionId) {
      throw new HttpsError("failed-precondition", "Custom item has no version to publish.");
    }

    const versionRef = itemRef.collection("versions").doc(targetVersionId);
    const versionSnapshot = await transaction.get(versionRef);
    if (!versionSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Custom item version not found.");
    }
    const version = versionSnapshot.data() as {
      data: { name: string };
      versionNumber: number;
    };
    const timestamp = FieldValue.serverTimestamp();

    transaction.update(versionRef, {
      status: "published",
      publishedAt: timestamp,
      publishedByUserId: actorUserId,
      updatedAt: timestamp,
      updatedBy: { userId: actorUserId },
    });
    transaction.update(itemRef, {
      status: "published",
      name: version.data.name.trim(),
      data: version.data,
      publishedVersionId: targetVersionId,
      draftVersionId: null,
      latestVersionId: targetVersionId,
      latestVersionNumber: version.versionNumber,
      archivedAt: null,
      archivedByUserId: null,
      updatedAt: timestamp,
      updatedBy: { userId: actorUserId },
    });

    return targetVersionId;
  });
}

async function resolveUpdateTargetVersionId(
  itemRef: FirebaseFirestore.DocumentReference,
  requestedVersionId: string | undefined
): Promise<string> {
  const itemSnapshot = await itemRef.get();
  if (!itemSnapshot.exists) throw new HttpsError("not-found", "Custom item not found.");
  const item = itemSnapshot.data() as {
    draftVersionId?: string | null;
    publishedVersionId?: string | null;
    latestVersionId?: string | null;
  };
  const targetVersionId =
    requestedVersionId ?? item.draftVersionId ?? item.publishedVersionId ?? item.latestVersionId;
  if (!targetVersionId) {
    throw new HttpsError("failed-precondition", "Custom item has no version to apply.");
  }
  const versionSnapshot = await itemRef.collection("versions").doc(targetVersionId).get();
  if (!versionSnapshot.exists) {
    throw new HttpsError("failed-precondition", "Custom item version no longer exists.");
  }
  return targetVersionId;
}

export async function startCustomItemMutationJob(
  input: StartCustomItemMutationJobInput,
  callerUid: string
): Promise<{ jobId: string; totalCount: number }> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (campaignSnapshot.data()?.dmId !== callerUid) {
    throw new HttpsError("permission-denied", "Only the campaign DM can perform this operation.");
  }

  const itemRef = campaignRef.collection("customItems").doc(input.customItemId);
  const itemExistsSnapshot = await itemRef.get();
  if (!itemExistsSnapshot.exists) {
    throw new HttpsError("not-found", "Custom item not found.");
  }

  let targetVersionId: string | null = null;

  if (input.mode === "publish-and-update") {
    targetVersionId = await publishTargetVersion(db, itemRef, input.versionId, input.actorUserId);
  } else if (input.mode === "update") {
    targetVersionId = await resolveUpdateTargetVersionId(itemRef, input.versionId);
  } else if (input.mode === "archive-and-remove") {
    await itemRef.update({
      status: "archived",
      archivedAt: FieldValue.serverTimestamp(),
      archivedByUserId: input.actorUserId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: { userId: input.actorUserId },
    });
  }

  const charactersCountSnapshot = await campaignRef.collection("characters").count().get();
  const totalCount = charactersCountSnapshot.data().count;

  const jobId = await createBulkJob(
    "custom-item-mutation",
    callerUid,
    {
      campaignId: input.campaignId,
      customItemId: input.customItemId,
      mode: input.mode,
      targetVersionId,
      actorUserId: input.actorUserId,
    },
    totalCount
  );

  return { jobId, totalCount };
}

export interface ProcessCustomItemMutationChunkInput {
  jobId: string;
}

export interface ProcessCustomItemMutationChunkResult {
  done: boolean;
  processedCount: number;
  totalCount: number;
  mutatedThisChunk: number;
}

export async function processCustomItemMutationChunk(
  input: ProcessCustomItemMutationChunkInput,
  callerUid: string
): Promise<ProcessCustomItemMutationChunkResult> {
  const { job, leaseId } = await acquireJobLease(input.jobId, callerUid);
  if (job.type !== "custom-item-mutation") {
    throw new HttpsError("failed-precondition", "Job is not a custom-item-mutation job.");
  }

  const db = getFirestore();
  const { campaignId, customItemId, mode, targetVersionId } = job.data as {
    campaignId: string;
    customItemId: string;
    mode: CustomItemMutationMode;
    targetVersionId: string | null;
    actorUserId: string;
  };

  try {
    const campaignRef = db.collection("campaigns").doc(campaignId);
    const campaignSnapshot = await campaignRef.get();
    if (!campaignSnapshot.exists || campaignSnapshot.data()?.dmId !== callerUid) {
      throw new HttpsError("permission-denied", "Only the campaign DM can perform this operation.");
    }

    let category: CustomItemCategory | null = null;
    let versionData: Record<string, unknown> | null = null;
    if ((mode === "publish-and-update" || mode === "update") && targetVersionId) {
      const itemRef = campaignRef.collection("customItems").doc(customItemId);
      const versionSnapshot = await itemRef.collection("versions").doc(targetVersionId).get();
      if (!versionSnapshot.exists) {
        throw new HttpsError("failed-precondition", "Custom item version no longer exists.");
      }
      const version = versionSnapshot.data() as { category: CustomItemCategory; data: Record<string, unknown> };
      category = version.category;
      versionData = version.data;
    }

    const checkpoint = parseCheckpoint(job.checkpoint);
    let pageQuery = campaignRef
      .collection("characters")
      .orderBy(FieldPath.documentId())
      .limit(CHUNK_SIZE);
    if (checkpoint.cursor) pageQuery = pageQuery.startAfter(checkpoint.cursor);
    const page = await pageQuery.get();

    let mutatedThisChunk = 0;
    if (!page.empty) {
      const batch = db.batch();
      for (const docSnapshot of page.docs) {
        const character = docSnapshot.data() as CharacterItemArrays;
        const result =
          mode === "publish-and-update" || mode === "update"
            ? buildCharacterCopyUpdate(character, category!, customItemId, targetVersionId!, versionData!)
            : buildCharacterCopyRemoval(character, customItemId);
        if (!result) continue;
        const { updatedCopies: _updatedCopies, removedCopies: _removedCopies, ...fields } = result as Record<
          string,
          unknown
        >;
        batch.update(docSnapshot.ref, fields);
        mutatedThisChunk += 1;
      }
      if (mutatedThisChunk > 0) await batch.commit();
    }

    const isLastPage = page.docs.length < CHUNK_SIZE;
    const processed = page.docs.length;

    if (isLastPage) {
      await completeJob(input.jobId, leaseId);
      return {
        done: true,
        processedCount: job.processedCount + processed,
        totalCount: job.totalCount,
        mutatedThisChunk,
      };
    }

    const nextCheckpoint: Checkpoint = { cursor: page.docs[page.docs.length - 1].id };
    await advanceJobCheckpoint(input.jobId, leaseId, JSON.stringify(nextCheckpoint), processed);
    return {
      done: false,
      processedCount: job.processedCount + processed,
      totalCount: job.totalCount,
      mutatedThisChunk,
    };
  } catch (error) {
    const message = error instanceof HttpsError ? error.message : "Unexpected error.";
    await failJob(input.jobId, leaseId, message);
    throw error;
  }
}
