// src/services/customItemService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Character } from "../types/Character";
import type {
  CampaignCustomItem,
  CampaignCustomItemVersion,
  CustomArmourData,
  CustomItemCategory,
  CustomItemCreator,
  CustomItemDataByCategory,
  CustomWeaponData,
} from "../types/CustomItems";
import { stripUndefined } from "../utils/stripUndefined";

const BATCH_WRITE_LIMIT = 450;

export interface CreateDraftCustomItemArgs<TCategory extends CustomItemCategory> {
  campaignId: string;
  category: TCategory;
  creator: CustomItemCreator;
  data: CustomItemDataByCategory[TCategory];
}

export interface SaveDraftCustomItemArgs<TCategory extends CustomItemCategory> {
  campaignId: string;
  customItemId: string;
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
  const itemRef = doc(customItemsCollectionRef(campaignId));
  const versionRef = doc(customItemVersionsCollectionRef(campaignId, itemRef.id));
  const timestamp = serverTimestamp();
  const name = data.name.trim();

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
    data,
  };

  const version: CampaignCustomItemVersion<TCategory> = {
    id: versionRef.id,
    campaignId,
    customItemId: itemRef.id,
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
  editor,
  data,
}: SaveDraftCustomItemArgs<TCategory>): Promise<string> {
  const itemRef = customItemDocRef(campaignId, customItemId);

  return runTransaction(db, async (transaction) => {
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) throw new Error("Custom item not found.");

    const item = itemSnap.data() as CampaignCustomItem<TCategory>;
    if (item.status === "archived") throw new Error("Archived custom items cannot be edited.");

    const timestamp = serverTimestamp();
    const isExistingDraft = !!item.draftVersionId;
    const draftVersionId = item.draftVersionId ?? doc(customItemVersionsCollectionRef(campaignId, customItemId)).id;
    const draftVersionRef = customItemVersionDocRef(campaignId, customItemId, draftVersionId);
    const versionNumber = isExistingDraft ? item.latestVersionNumber : item.latestVersionNumber + 1;
    const name = data.name.trim();

    if (isExistingDraft) {
      transaction.update(draftVersionRef, {
        data: stripUndefined(data) as CampaignCustomItemVersion<TCategory>["data"],
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
        data,
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
      data: stripUndefined(data),
      draftVersionId,
      latestVersionId: draftVersionId,
      latestVersionNumber: versionNumber,
      status: item.publishedVersionId ? item.status : "draft",
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
}

export async function archiveCustomItem({
  campaignId,
  customItemId,
  actorUserId,
}: CustomItemActorArgs): Promise<void> {
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
  const itemRef = customItemDocRef(campaignId, customItemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) throw new Error("Custom item not found.");

  const item = itemSnap.data() as CampaignCustomItem;
  await updateDoc(itemRef, {
    status: item.publishedVersionId ? "published" : "draft",
    archivedAt: null,
    archivedByUserId: null,
    updatedAt: serverTimestamp(),
    updatedBy: { userId: actorUserId },
  });
}

export async function permanentlyDeleteCustomItem({
  campaignId,
  customItemId,
}: Pick<CustomItemActorArgs, "campaignId" | "customItemId">): Promise<void> {
  const versionsSnap = await getDocs(customItemVersionsCollectionRef(campaignId, customItemId));
  let batch = writeBatch(db);
  let ops = 0;

  for (const versionDoc of versionsSnap.docs) {
    batch.delete(versionDoc.ref);
    ops += 1;
    if (ops >= BATCH_WRITE_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  batch.delete(customItemDocRef(campaignId, customItemId));
  await batch.commit();
}

export async function updateAllCustomItemCopies({
  campaignId,
  customItemId,
  versionId,
}: UpdateAllCopiesArgs): Promise<number> {
  const itemSnap = await getDoc(customItemDocRef(campaignId, customItemId));
  if (!itemSnap.exists()) throw new Error("Custom item not found.");

  const item = itemSnap.data() as CampaignCustomItem;
  const targetVersionId = versionId ?? item.publishedVersionId ?? item.latestVersionId;
  if (!targetVersionId) throw new Error("Custom item has no version to apply.");

  const versionSnap = await getDoc(customItemVersionDocRef(campaignId, customItemId, targetVersionId));
  if (!versionSnap.exists()) throw new Error("Custom item version not found.");

  const version = versionSnap.data() as CampaignCustomItemVersion;
  const charactersSnap = await getDocs(collection(db, "campaigns", campaignId, "characters"));
  let batch = writeBatch(db);
  let ops = 0;
  let updatedCopies = 0;

  for (const characterDoc of charactersSnap.docs) {
    const character = { id: characterDoc.id, ...characterDoc.data() } as Character;
    const update = buildCharacterCopyUpdate(
      character,
      item.category,
      customItemId,
      targetVersionId,
      version.data
    );

    if (!update) continue;

    batch.update(characterDoc.ref, stripUndefined(update));
    ops += 1;
    updatedCopies += update.updatedCopies;

    if (ops >= BATCH_WRITE_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return updatedCopies;
}

export function buildCharacterCopyUpdate(
  character: Character,
  category: CustomItemCategory,
  customItemId: string,
  customLibraryVersionId: string,
  data: CampaignCustomItemVersion["data"]
): ({ updatedCopies: number } & Partial<Character>) | null {
  if (category === "weapon") {
    const weaponData = data as CustomWeaponData;
    if (weaponData.weaponKind === "ranged") {
      return updateLinkedArray(
        "rangedWeapons",
        character.rangedWeapons,
        customItemId,
        customLibraryVersionId,
        stripKindFields(weaponData)
      );
    }
    if (weaponData.weaponKind === "melee") {
      return updateLinkedArray(
        "meleeWeapons",
        character.meleeWeapons,
        customItemId,
        customLibraryVersionId,
        stripKindFields(weaponData)
      );
    }
    return updateLinkedArray(
      "grenades",
      character.grenades,
      customItemId,
      customLibraryVersionId,
      stripKindFields(weaponData)
    );
  }

  if (category === "armour") {
    const armourData = data as CustomArmourData;
    return armourData.armourKind === "shield"
      ? updateLinkedArray("shields", character.shields, customItemId, customLibraryVersionId, stripKindFields(armourData))
      : updateLinkedArray("armour", character.armour, customItemId, customLibraryVersionId, stripKindFields(armourData));
  }

  switch (category) {
    case "gear":
      return updateLinkedArray("gear", character.gear, customItemId, customLibraryVersionId, data);
    case "consumable":
      return updateLinkedArray("consumables", character.consumables, customItemId, customLibraryVersionId, data);
    case "drug":
      return updateLinkedArray("drugs", character.drugs, customItemId, customLibraryVersionId, data);
    case "cybernetic":
      return updateLinkedArray("cybernetics", character.cybernetics, customItemId, customLibraryVersionId, data);
    case "archeotech":
      return updateLinkedArray("archeotech", character.archeotech, customItemId, customLibraryVersionId, data);
    default:
      return null;
  }
}

function updateLinkedArray<TItem extends { customLibraryId?: string; customLibraryVersionId?: string }>(
  field: keyof Character,
  items: TItem[] | undefined,
  customLibraryId: string,
  customLibraryVersionId: string,
  definitionData: object
): ({ updatedCopies: number } & Partial<Character>) | null {
  if (!items?.length) return null;

  let updatedCopies = 0;
  const next = items.map((item) => {
    if (item.customLibraryId !== customLibraryId) return item;
    updatedCopies += 1;
    return {
      ...item,
      ...definitionData,
      customLibraryId,
      customLibraryVersionId,
    };
  });

  if (updatedCopies === 0) return null;
  return { [field]: next, updatedCopies } as { updatedCopies: number } & Partial<Character>;
}

function stripKindFields<TData extends object>(data: TData): object {
  const copy = { ...data } as Record<string, unknown>;
  delete copy.weaponKind;
  delete copy.armourKind;
  return copy;
}
