// src/services/customItemService.ts

import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import type {
  CampaignCustomItem,
  CampaignCustomItemVersion,
  CustomItemCategory,
  CustomItemCreator,
  CustomItemDataByCategory,
  CustomItemStatus,
} from "../types/CustomItems";
import { stripUndefined } from "../utils/stripUndefined";
import { runSingleFlight } from "../firestore/singleFlight";
import {
  assertCustomItemCreator,
  assertCustomItemData,
  assertFirestoreDocumentId,
} from "../firestore/firebaseValidation";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import {
  assertSafeDestructivePreflight,
  BoundedDeletionCollector,
  type DestructiveOperationPreflight,
} from "../firestore/destructiveOperationPreflight";
import { deleteRefsAtomically } from "../firestore/firestoreBatchDelete";
import { driveJobToCompletion } from "../firestore/bulkJobClient";

export interface CreateDraftCustomItemArgs<TCategory extends CustomItemCategory> {
  campaignId: string;
  category: TCategory;
  creator: CustomItemCreator;
  data: CustomItemDataByCategory[TCategory];
}

export interface SaveDraftCustomItemArgs<TCategory extends CustomItemCategory> {
  campaignId: string;
  customItemId: string;
  category: TCategory;
  editor: CustomItemCreator;
  data: CustomItemDataByCategory[TCategory];
}

export interface CustomItemActorArgs {
  campaignId: string;
  customItemId: string;
  actorUserId: string;
}

export interface PublishCustomItemArgs extends CustomItemActorArgs {
  versionId?: string;
}

export interface UpdateAllCopiesArgs extends CustomItemActorArgs {
  versionId?: string;
}

export interface CustomItemOperationPreflight extends DestructiveOperationPreflight {
  affectedCharacterDocuments: number;
  affectedCopies: number;
  scannedCharacters: number;
}

export function customItemsCollectionRef(campaignId: string) {
  return collection(db, "campaigns", campaignId, "customItems");
}

export function customItemDocRef(campaignId: string, customItemId: string) {
  return doc(db, "campaigns", campaignId, "customItems", customItemId);
}

export function customItemVersionsCollectionRef(campaignId: string, customItemId: string) {
  return collection(db, "campaigns", campaignId, "customItems", customItemId, "versions");
}

export function customItemVersionDocRef(
  campaignId: string,
  customItemId: string,
  versionId: string
) {
  return doc(db, "campaigns", campaignId, "customItems", customItemId, "versions", versionId);
}

export async function createDraftCustomItem<TCategory extends CustomItemCategory>({
  campaignId,
  category,
  creator,
  data,
}: CreateDraftCustomItemArgs<TCategory>): Promise<{
  customItemId: string;
  versionId: string;
}> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertCustomItemCreator(creator);
  const cleanData = stripUndefined(data);
  assertCustomItemData(category, cleanData);
  const itemRef = doc(customItemsCollectionRef(campaignId));
  const versionRef = doc(customItemVersionsCollectionRef(campaignId, itemRef.id));
  const timestamp = serverTimestamp();
  const name = cleanData.name.trim();

  const item: CampaignCustomItem<TCategory> = {
    id: itemRef.id,
    campaignId,
    category,
    status: "draft",
    name,
    creator,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: versionRef.id,
    latestVersionId: versionRef.id,
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data: cleanData,
  };

  const version: CampaignCustomItemVersion<TCategory> = {
    id: versionRef.id,
    campaignId,
    customItemId: itemRef.id,
    category,
    versionNumber: 1,
    status: "draft",
    data: cleanData,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: creator,
    updatedBy: creator,
    publishedAt: null,
    publishedByUserId: null,
  };

  const batch = writeBatch(db);
  batch.set(itemRef, stripUndefined(item));
  batch.set(versionRef, stripUndefined(version));
  await batch.commit();

  return { customItemId: itemRef.id, versionId: versionRef.id };
}

export async function saveDraftCustomItem<TCategory extends CustomItemCategory>({
  campaignId,
  customItemId,
  category,
  editor,
  data,
}: SaveDraftCustomItemArgs<TCategory>): Promise<string> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertCustomItemCreator(editor, "Custom-item editor");
  const cleanData = stripUndefined(data);
  assertCustomItemData(category, cleanData);
  const itemRef = customItemDocRef(campaignId, customItemId);

  return runTransaction(db, async (transaction) => {
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) throw new Error("Custom item not found.");

    const item = itemSnap.data() as CampaignCustomItem<TCategory>;
    if (item.category !== category) throw new Error("Custom-item category does not match.");
    if (item.status === "archived") throw new Error("Archived custom items cannot be edited.");

    const timestamp = serverTimestamp();
    const isExistingDraft = !!item.draftVersionId;
    const draftVersionId =
      item.draftVersionId ?? doc(customItemVersionsCollectionRef(campaignId, customItemId)).id;
    const draftVersionRef = customItemVersionDocRef(campaignId, customItemId, draftVersionId);
    const versionNumber = isExistingDraft ? item.latestVersionNumber : item.latestVersionNumber + 1;
    const name = cleanData.name.trim();

    if (isExistingDraft) {
      transaction.update(draftVersionRef, {
        data: cleanData as CampaignCustomItemVersion<TCategory>["data"],
        updatedAt: timestamp,
        updatedBy: editor,
      });
    } else {
      const version: CampaignCustomItemVersion<TCategory> = {
        id: draftVersionId,
        campaignId,
        customItemId,
        category: item.category,
        versionNumber,
        status: "draft",
        data: cleanData,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: editor,
        updatedBy: editor,
        publishedAt: null,
        publishedByUserId: null,
      };
      transaction.set(draftVersionRef, stripUndefined(version));
    }
    transaction.update(itemRef, {
      name,
      data: cleanData,
      draftVersionId,
      latestVersionId: draftVersionId,
      latestVersionNumber: versionNumber,
      status: "draft",
      updatedAt: timestamp,
      updatedBy: editor,
    });

    return draftVersionId;
  });
}

export async function publishCustomItem({
  campaignId,
  customItemId,
  actorUserId,
  versionId,
}: PublishCustomItemArgs): Promise<string> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  if (versionId !== undefined) assertFirestoreDocumentId(versionId, "Version ID");
  return runSingleFlight("custom-item:publish", [campaignId, customItemId], async () => {
    const itemRef = customItemDocRef(campaignId, customItemId);

    return runTransaction(db, async (transaction) => {
      const itemSnap = await transaction.get(itemRef);
      if (!itemSnap.exists()) throw new Error("Custom item not found.");

      const item = itemSnap.data() as CampaignCustomItem;
      const targetVersionId = versionId ?? item.draftVersionId ?? item.latestVersionId;
      if (!targetVersionId) throw new Error("Custom item has no version to publish.");

      const versionRef = customItemVersionDocRef(campaignId, customItemId, targetVersionId);
      const versionSnap = await transaction.get(versionRef);
      if (!versionSnap.exists()) throw new Error("Custom item version not found.");

      const version = versionSnap.data() as CampaignCustomItemVersion;
      assertCustomItemData(version.category, stripUndefined(version.data));
      const timestamp = serverTimestamp();

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
        data: stripUndefined(version.data),
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
  });
}

export async function archiveCustomItem({
  campaignId,
  customItemId,
  actorUserId,
}: CustomItemActorArgs): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  await updateDoc(customItemDocRef(campaignId, customItemId), {
    status: "archived",
    archivedAt: serverTimestamp(),
    archivedByUserId: actorUserId,
    updatedAt: serverTimestamp(),
    updatedBy: { userId: actorUserId },
  });
}

export async function restoreCustomItem({
  campaignId,
  customItemId,
  actorUserId,
}: CustomItemActorArgs): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  const itemSnap = await getDoc(customItemDocRef(campaignId, customItemId));
  if (!itemSnap.exists()) throw new Error("Custom item not found.");
  const item = itemSnap.data() as CampaignCustomItem;
  if (item.status !== "archived") throw new Error("Only archived items can be restored.");
  await updateDoc(customItemDocRef(campaignId, customItemId), {
    status: item.publishedVersionId ? "published" : "draft",
    archivedAt: null,
    archivedByUserId: null,
    updatedAt: serverTimestamp(),
    updatedBy: { userId: actorUserId },
  });
}

function customItemPreflight(
  affectedDocuments: number,
  targetExists: boolean,
  affectedCharacterDocuments: number,
  affectedCopies: number,
  scannedCharacters: number,
  reason?: string
): CustomItemOperationPreflight {
  const overWriteLimit = affectedDocuments > PRODUCT_LIMITS.bulkOperationDocuments;
  return {
    affectedDocuments,
    limit: PRODUCT_LIMITS.bulkOperationDocuments,
    safe: targetExists && !reason && !overWriteLimit,
    targetExists,
    counts: {
      customItems: targetExists ? 1 : 0,
      characters: affectedCharacterDocuments,
    },
    affectedCharacterDocuments,
    affectedCopies,
    scannedCharacters,
    ...(reason
      ? { reason }
      : overWriteLimit
        ? {
            reason: `This operation affects more than ${PRODUCT_LIMITS.bulkOperationDocuments} documents and requires the protected bulk job.`,
          }
        : {}),
  };
}

export async function permanentlyDeleteCustomItem({
  campaignId,
  customItemId,
}: {
  campaignId: string;
  customItemId: string;
}): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  await runSingleFlight("custom-item:permanent-delete", [campaignId, customItemId], async () => {
    const plan = await buildPermanentCustomItemDeletionPlan(campaignId, customItemId);
    assertSafeDestructivePreflight(plan.preflight, "Custom item");
    await deleteRefsAtomically(db, plan.references);
  });
}

async function buildPermanentCustomItemDeletionPlan(
  campaignId: string,
  customItemId: string
): Promise<{ preflight: CustomItemOperationPreflight; references: DocumentReference[] }> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  const collector = new BoundedDeletionCollector();
  const itemRef = customItemDocRef(campaignId, customItemId);
  const itemSnap = await getDoc(itemRef);
  collector.addSnapshot(itemSnap, "customItems");
  if (!itemSnap.exists()) {
    return {
      preflight: customItemPreflight(0, false, 0, 0, 0),
      references: [],
    };
  }
  if ((itemSnap.data() as CampaignCustomItem).status !== "archived") {
    return {
      preflight: customItemPreflight(
        1,
        true,
        0,
        0,
        0,
        "Only archived items can be permanently deleted."
      ),
      references: [],
    };
  }
  await collector.addQuery(collection(itemRef, "versions"), "customItemVersions");
  const base = collector.result(true);
  const preflight: CustomItemOperationPreflight = {
    ...base,
    affectedCharacterDocuments: 0,
    affectedCopies: 0,
    scannedCharacters: 0,
  };
  return {
    preflight,
    references: preflight.safe ? collector.references() : [],
  };
}

export async function preflightPermanentCustomItemDeletion({
  campaignId,
  customItemId,
}: {
  campaignId: string;
  customItemId: string;
}): Promise<CustomItemOperationPreflight> {
  return (await buildPermanentCustomItemDeletionPlan(campaignId, customItemId)).preflight;
}

type CustomItemMutationMode = "publish-and-update" | "update" | "remove" | "archive-and-remove";

const callStartCustomItemMutationJob = httpsCallable<
  {
    campaignId: string;
    customItemId: string;
    mode: CustomItemMutationMode;
    versionId?: string;
    actorUserId: string;
  },
  { jobId: string; totalCount: number }
>(functions, "startCustomItemMutationJob");

const callProcessCustomItemMutationChunk = httpsCallable<
  { jobId: string },
  { done: boolean; processedCount: number; totalCount: number; mutatedThisChunk: number }
>(functions, "processCustomItemMutationChunk");

async function driveCustomItemMutationJob(
  jobId: string,
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void
): Promise<number> {
  let mutatedTotal = 0;
  await driveJobToCompletion(
    jobId,
    async (id) => {
      const chunk = (await callProcessCustomItemMutationChunk({ jobId: id })).data;
      mutatedTotal += chunk.mutatedThisChunk;
      return chunk;
    },
    (chunk) => onProgress?.({ processedCount: chunk.processedCount, totalCount: chunk.totalCount })
  );
  return mutatedTotal;
}

/**
 * Publishes the target version and propagates it to every character copy,
 * via the resumable startCustomItemMutationJob/processCustomItemMutationChunk
 * Functions (mode "publish-and-update"). Runs start and drain together as
 * one call — the item-level publish transition happens immediately once
 * called, so there is no separate non-mutating preview step. Returns the
 * number of copies actually updated.
 */
export async function publishAndUpdateAllCopies({
  campaignId,
  customItemId,
  actorUserId,
  onProgress,
}: CustomItemActorArgs & {
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void;
}): Promise<number> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  return runSingleFlight("custom-item:publish-propagate", [campaignId, customItemId], async () => {
    const { data: started } = await callStartCustomItemMutationJob({
      campaignId,
      customItemId,
      mode: "publish-and-update",
      actorUserId,
    });
    return driveCustomItemMutationJob(started.jobId, onProgress);
  });
}

/**
 * Propagates an already-resolved version to every character copy, via the
 * resumable job (mode "update"), without publishing anything new. Returns
 * the number of copies actually updated.
 */
export async function updateAllCustomItemCopies({
  campaignId,
  customItemId,
  versionId,
  actorUserId,
  onProgress,
}: UpdateAllCopiesArgs & {
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void;
}): Promise<number> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  if (versionId !== undefined) assertFirestoreDocumentId(versionId, "Version ID");
  return runSingleFlight("custom-item:propagate", [campaignId, customItemId], async () => {
    const { data: started } = await callStartCustomItemMutationJob({
      campaignId,
      customItemId,
      mode: "update",
      versionId,
      actorUserId,
    });
    return driveCustomItemMutationJob(started.jobId, onProgress);
  });
}

/**
 * Strips every character copy of this item, via the resumable job (mode
 * "remove"), without archiving the definition. Returns the number of
 * copies actually removed.
 */
export async function removeAllCustomItemCopies({
  campaignId,
  customItemId,
  actorUserId,
  onProgress,
}: CustomItemActorArgs & {
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void;
}): Promise<number> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  return runSingleFlight("custom-item:remove-copies", [campaignId, customItemId], async () => {
    const { data: started } = await callStartCustomItemMutationJob({
      campaignId,
      customItemId,
      mode: "remove",
      actorUserId,
    });
    return driveCustomItemMutationJob(started.jobId, onProgress);
  });
}

/**
 * Archives the definition and strips every character copy, via the
 * resumable job (mode "archive-and-remove"). Runs start and drain together
 * as one call — the archive transition happens immediately once called, so
 * there is no separate non-mutating preview step. Returns the number of
 * copies actually removed.
 */
export async function archiveAndRemoveAllCustomItemCopies({
  campaignId,
  customItemId,
  actorUserId,
  onProgress,
}: CustomItemActorArgs & {
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void;
}): Promise<number> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  return runSingleFlight("custom-item:archive-remove", [campaignId, customItemId], async () => {
    const { data: started } = await callStartCustomItemMutationJob({
      campaignId,
      customItemId,
      mode: "archive-and-remove",
      actorUserId,
    });
    return driveCustomItemMutationJob(started.jobId, onProgress);
  });
}

export function inferCustomItemStatus(item: { customLibraryVersionId?: string }): CustomItemStatus {
  return item.customLibraryVersionId ? "published" : "draft";
}
