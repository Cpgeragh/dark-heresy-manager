import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  CUSTOM_ITEM_CATEGORIES,
  assertCustomItemCreatorData,
  assertCustomItemData,
  assertCustomItemDocumentId,
  type CustomItemCategory,
} from "shared-rules";
import { callerIsPrimaryOrLinked, resolvePrimaryUid } from "../shared/linkedIdentity.js";

export type CustomItemAction =
  | "create"
  | "save-draft"
  | "publish"
  | "archive"
  | "restore"
  | "delete";

export interface CustomItemMutationInput {
  action: CustomItemAction;
  campaignId: string;
  customItemId?: string;
  versionId?: string;
  category?: CustomItemCategory;
  creator?: { userId: string; characterId?: string; characterName?: string };
  data?: Record<string, unknown>;
  operationId?: string;
}

export interface CustomItemMutationResult {
  customItemId?: string;
  versionId?: string;
}

function invalid(error: unknown): never {
  throw new HttpsError(
    "invalid-argument",
    error instanceof Error ? error.message : "Custom item is invalid."
  );
}

function assertId(value: unknown, label: string): asserts value is string {
  try {
    assertCustomItemDocumentId(value, label);
  } catch (error) {
    invalid(error);
  }
}

function validateCreator(
  value: unknown
): asserts value is { userId: string; characterId?: string; characterName?: string } {
  try {
    assertCustomItemCreatorData(value);
  } catch (error) {
    invalid(error);
  }
}

function validateData(category: unknown, data: unknown): asserts data is Record<string, unknown> {
  try {
    assertCustomItemData(category, data);
  } catch (error) {
    invalid(error);
  }
}

async function requireCampaign(db: FirebaseFirestore.Firestore, campaignId: string) {
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const snapshot = await campaignRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Campaign not found.");
  return { campaignRef, campaign: snapshot.data() ?? {} };
}

export async function mutateCustomItem(
  input: CustomItemMutationInput,
  callerUid: string
): Promise<CustomItemMutationResult> {
  const db = getFirestore();
  assertId(input.campaignId, "Campaign ID");
  const { campaignRef, campaign } = await requireCampaign(db, input.campaignId);
  const dmAccess = await callerIsPrimaryOrLinked(db, callerUid, campaign.dmId);
  const actorUid = await resolvePrimaryUid(db, callerUid);

  if (input.action === "create") {
    if (!input.category || !CUSTOM_ITEM_CATEGORIES.includes(input.category)) {
      throw new HttpsError("invalid-argument", "Custom-item category is invalid.");
    }
    validateCreator(input.creator);
    validateData(input.category, input.data);
    const creatorUid = input.creator.userId;
    const creatorAccess = await callerIsPrimaryOrLinked(db, callerUid, creatorUid);
    const members = Array.isArray(campaign.memberIds) ? campaign.memberIds : [];
    if (!creatorAccess || (creatorUid !== campaign.dmId && !members.includes(creatorUid))) {
      throw new HttpsError(
        "permission-denied",
        "You cannot create a custom item for this campaign."
      );
    }
    if (!input.operationId) throw new HttpsError("invalid-argument", "Operation ID is required.");
    assertId(input.operationId, "Operation ID");
    const itemRef = campaignRef.collection("customItems").doc(input.operationId);
    const versionRef = itemRef.collection("versions").doc();
    const now = FieldValue.serverTimestamp();
    const cleanData = input.data;
    const creator = input.creator;
    const item = {
      id: itemRef.id,
      campaignId: input.campaignId,
      category: input.category,
      status: "draft",
      name: String(cleanData.name).trim(),
      creator,
      createdAt: now,
      updatedAt: now,
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
    const version = {
      id: versionRef.id,
      campaignId: input.campaignId,
      customItemId: itemRef.id,
      category: input.category,
      versionNumber: 1,
      status: "draft",
      data: cleanData,
      createdAt: now,
      updatedAt: now,
      createdBy: creator,
      updatedBy: creator,
      publishedAt: null,
      publishedByUserId: null,
    };
    const createdVersionId = await db.runTransaction(async (transaction) => {
      const existingItem = await transaction.get(itemRef);
      if (existingItem.exists) {
        const existing = existingItem.data()!;
        if (
          existing.creator?.userId !== creatorUid ||
          existing.category !== input.category ||
          JSON.stringify(existing.data) !== JSON.stringify(cleanData) ||
          typeof existing.draftVersionId !== "string"
        ) {
          throw new HttpsError(
            "already-exists",
            "This custom-item creation request has already been used."
          );
        }
        return existing.draftVersionId;
      }
      transaction.create(itemRef, item);
      transaction.create(versionRef, version);
      return versionRef.id;
    });
    return { customItemId: itemRef.id, versionId: createdVersionId };
  }

  assertId(input.customItemId, "Custom-item ID");
  const itemRef = campaignRef.collection("customItems").doc(input.customItemId);
  const itemSnapshot = await itemRef.get();
  if (!itemSnapshot.exists) throw new HttpsError("not-found", "Custom item not found.");
  const item = itemSnapshot.data()!;
  const creator = item.creator as { userId?: unknown } | undefined;
  const creatorAccess = await callerIsPrimaryOrLinked(db, callerUid, creator?.userId);

  if (input.action === "save-draft") {
    if (!creatorAccess && !dmAccess)
      throw new HttpsError("permission-denied", "You cannot edit this custom item.");
    if (!input.category || input.category !== item.category) {
      throw new HttpsError("invalid-argument", "Custom-item category does not match.");
    }
    validateData(input.category, input.data);
    if (item.status === "archived")
      throw new HttpsError("failed-precondition", "Archived custom items cannot be edited.");
    const result = await db.runTransaction(async (transaction) => {
      const freshSnapshot = await transaction.get(itemRef);
      if (!freshSnapshot.exists) throw new HttpsError("not-found", "Custom item not found.");
      const fresh = freshSnapshot.data()!;
      if (fresh.category !== input.category)
        throw new HttpsError("invalid-argument", "Custom-item category does not match.");
      if (fresh.status === "archived")
        throw new HttpsError("failed-precondition", "Archived custom items cannot be edited.");
      const versionId =
        typeof fresh.draftVersionId === "string"
          ? fresh.draftVersionId
          : itemRef.collection("versions").doc().id;
      const versionRef = itemRef.collection("versions").doc(versionId);
      const versionSnapshot = await transaction.get(versionRef);
      const versionNumber =
        typeof fresh.draftVersionId === "string"
          ? fresh.latestVersionNumber
          : fresh.latestVersionNumber + 1;
      const now = FieldValue.serverTimestamp();
      if (versionSnapshot.exists) {
        transaction.update(versionRef, {
          data: input.data,
          updatedAt: now,
          updatedBy: { userId: actorUid },
        });
      } else {
        transaction.create(versionRef, {
          id: versionId,
          campaignId: input.campaignId,
          customItemId: input.customItemId,
          category: fresh.category,
          versionNumber,
          status: "draft",
          data: input.data,
          createdAt: now,
          updatedAt: now,
          createdBy: { userId: actorUid },
          updatedBy: { userId: actorUid },
          publishedAt: null,
          publishedByUserId: null,
        });
      }
      transaction.update(itemRef, {
        name: String(input.data!.name).trim(),
        data: input.data,
        draftVersionId: versionId,
        latestVersionId: versionId,
        latestVersionNumber: versionNumber,
        status: "draft",
        updatedAt: now,
        updatedBy: { userId: actorUid },
      });
      return versionId;
    });
    return { customItemId: input.customItemId, versionId: result };
  }

  if (!dmAccess)
    throw new HttpsError("permission-denied", "Only the campaign DM can perform this operation.");
  if (input.action === "publish") {
    const versionId = input.versionId ?? item.draftVersionId ?? item.latestVersionId;
    assertId(versionId, "Version ID");
    const versionRef = itemRef.collection("versions").doc(versionId);
    await db.runTransaction(async (transaction) => {
      const currentItem = await transaction.get(itemRef);
      const currentVersion = await transaction.get(versionRef);
      if (!currentItem.exists || !currentVersion.exists)
        throw new HttpsError("not-found", "Custom item version not found.");
      const current = currentVersion.data()!;
      if (current.category !== currentItem.data()?.category) {
        throw new HttpsError(
          "failed-precondition",
          "Custom-item version category does not match its item."
        );
      }
      validateData(current.category, current.data);
      const now = FieldValue.serverTimestamp();
      transaction.update(versionRef, {
        status: "published",
        publishedAt: now,
        publishedByUserId: actorUid,
        updatedAt: now,
        updatedBy: { userId: actorUid },
      });
      transaction.update(itemRef, {
        status: "published",
        name: String(current.data.name).trim(),
        data: current.data,
        publishedVersionId: versionId,
        draftVersionId: null,
        latestVersionId: versionId,
        latestVersionNumber: current.versionNumber,
        archivedAt: null,
        archivedByUserId: null,
        updatedAt: now,
        updatedBy: { userId: actorUid },
      });
    });
    return { customItemId: input.customItemId, versionId };
  }
  if (input.action === "archive") {
    await itemRef.update({
      status: "archived",
      archivedAt: FieldValue.serverTimestamp(),
      archivedByUserId: actorUid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: { userId: actorUid },
    });
    return { customItemId: input.customItemId };
  }
  if (input.action === "restore") {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(itemRef);
      if (!current.exists) throw new HttpsError("not-found", "Custom item not found.");
      const currentItem = current.data()!;
      if (currentItem.status !== "archived") {
        throw new HttpsError("failed-precondition", "Only archived items can be restored.");
      }
      transaction.update(itemRef, {
        status: currentItem.publishedVersionId ? "published" : "draft",
        archivedAt: null,
        archivedByUserId: null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: { userId: actorUid },
      });
    });
    return { customItemId: input.customItemId };
  }
  if (input.action === "delete") {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(itemRef);
      if (!current.exists) throw new HttpsError("not-found", "Custom item not found.");
      if (current.data()?.status !== "archived") {
        throw new HttpsError(
          "failed-precondition",
          "Only archived items can be permanently deleted."
        );
      }
      const versions = await transaction.get(itemRef.collection("versions"));
      if (versions.size > 499) {
        throw new HttpsError(
          "resource-exhausted",
          "This custom item has too many versions to delete safely."
        );
      }
      versions.docs.forEach((version) => transaction.delete(version.ref));
      transaction.delete(itemRef);
    });
    return { customItemId: input.customItemId };
  }
  throw new HttpsError("invalid-argument", "Custom-item action is invalid.");
}
