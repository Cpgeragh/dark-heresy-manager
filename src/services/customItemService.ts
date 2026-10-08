// src/services/customItemService.ts

import { collection, doc, getDoc, type DocumentReference } from "firebase/firestore";
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
import { driveJobToCompletion } from "../firestore/bulkJobClient";
import { measurePerformanceMutation } from "../performance/performanceMetrics";

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

export interface DraftCustomItemDocuments<TCategory extends CustomItemCategory> {
  item: CampaignCustomItem<TCategory>;
  version: CampaignCustomItemVersion<TCategory>;
}

interface CustomItemMutationRequest {
  action: "create" | "save-draft" | "publish" | "archive" | "restore" | "delete";
  campaignId: string;
  customItemId?: string;
  versionId?: string;
  category?: CustomItemCategory;
  creator?: CustomItemCreator;
  data?: Record<string, unknown>;
  operationId?: string;
}

interface CustomItemMutationResponse {
  customItemId?: string;
  versionId?: string;
}

const callCustomItemMutation = httpsCallable<CustomItemMutationRequest, CustomItemMutationResponse>(
  functions,
  "mutateCustomItem"
);

export function buildDraftCustomItemDocuments<TCategory extends CustomItemCategory>({
  campaignId,
  customItemId,
  versionId,
  category,
  creator,
  data,
  timestamp,
}: CreateDraftCustomItemArgs<TCategory> & {
  customItemId: string;
  versionId: string;
  timestamp: CampaignCustomItem<TCategory>["createdAt"];
}): DraftCustomItemDocuments<TCategory> {
  const name = data.name.trim();
  const item = stripUndefined<CampaignCustomItem<TCategory>>({
    id: customItemId,
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
    draftVersionId: versionId,
    latestVersionId: versionId,
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  });
  const version = stripUndefined<CampaignCustomItemVersion<TCategory>>({
    id: versionId,
    campaignId,
    customItemId,
    category,
    versionNumber: 1,
    status: "draft",
    data,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: creator,
    updatedBy: creator,
    publishedAt: null,
    publishedByUserId: null,
  });

  return { item, version };
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
  const operationId = crypto.randomUUID();
  const result = await measurePerformanceMutation("custom-item:create-draft", () =>
    callCustomItemMutation({
      action: "create",
      campaignId,
      category,
      creator,
      data: cleanData,
      operationId,
    })
  );
  if (!result.data.customItemId || !result.data.versionId)
    throw new Error("Custom-item creation returned an invalid result.");
  return { customItemId: result.data.customItemId, versionId: result.data.versionId };
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
  const result = await measurePerformanceMutation("custom-item:save-draft", () =>
    callCustomItemMutation({
      action: "save-draft",
      campaignId,
      customItemId,
      category,
      creator: editor,
      data: cleanData,
    })
  );
  if (!result.data.versionId) throw new Error("Custom-item save returned an invalid result.");
  return result.data.versionId;
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
  return measurePerformanceMutation("custom-item:publish", () =>
    runSingleFlight("custom-item:publish", [campaignId, customItemId], async () => {
      const result = await callCustomItemMutation({
        action: "publish",
        campaignId,
        customItemId,
        versionId,
      });
      if (!result.data.versionId)
        throw new Error("Custom-item publish returned an invalid result.");
      return result.data.versionId;
    })
  );
}

export async function archiveCustomItem({
  campaignId,
  customItemId,
  actorUserId,
}: CustomItemActorArgs): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  await measurePerformanceMutation("custom-item:archive", () =>
    callCustomItemMutation({ action: "archive", campaignId, customItemId })
  );
}

export async function restoreCustomItem({
  campaignId,
  customItemId,
  actorUserId,
}: CustomItemActorArgs): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(customItemId, "Custom-item ID");
  assertFirestoreDocumentId(actorUserId, "Actor user ID");
  await measurePerformanceMutation("custom-item:restore", () =>
    callCustomItemMutation({ action: "restore", campaignId, customItemId })
  );
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
    const preflight = await preflightPermanentCustomItemDeletion({ campaignId, customItemId });
    assertSafeDestructivePreflight(preflight, "Custom item");
    await callCustomItemMutation({ action: "delete", campaignId, customItemId });
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
 * one call; the item-level publish transition happens immediately once
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
 * as one call; the archive transition happens immediately once called, so
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
