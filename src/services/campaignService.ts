// src/services/campaignService.ts
// Firestore operations for campaign documents.

import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";
import { batchDeleteRefs } from "../utils/firestoreBatchDelete";
import { validateCampaignName } from "../utils/validation";
import { deleteQueryDocsInPages, forEachQueryPage } from "../utils/firestoreQueryPages";
import { deleteCharacter } from "./characterService";

/**
 * Creates a new campaign owned by the given DM.
 * Returns the new campaign's Firestore document ID.
 */
export async function createCampaign(name: string, dmId: string): Promise<string> {
  const trimmedName = name.trim();
  const validation = validateCampaignName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);
  if (!dmId) throw new Error("A campaign owner is required.");

  const newRef = doc(collection(db, "campaigns"));

  const campaignData: CampaignDocument = {
    name: trimmedName,
    dmId,
    memberIds: [],
    createdAt: new Date(),
    archivedAt: null,
  };

  await setDoc(newRef, campaignData);
  return newRef.id;
}

/**
 * Updates the name of an existing campaign.
 */
export async function updateCampaignName(campaignId: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  const validation = validateCampaignName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);

  await updateDoc(doc(db, "campaigns", campaignId), { name: trimmedName });
}

/**
 * Soft-deletes a campaign by stamping archivedAt with the current server time.
 * Archived campaigns are excluded from active campaign subscriptions.
 */
export async function archiveCampaign(campaignId: string): Promise<void> {
  await updateDoc(doc(db, "campaigns", campaignId), {
    archivedAt: serverTimestamp(),
  });
}

/**
 * Restores an archived campaign so it reappears in active subscriptions.
 */
export async function restoreCampaign(campaignId: string): Promise<void> {
  await updateDoc(doc(db, "campaigns", campaignId), {
    archivedAt: null,
  });
}

/**
 * Deletes a campaign and all its subcollection data.
 * Cleans up: characters (+ their claimLog / xpProposals), sessions,
 * message threads (+ their messages), the custom item library (+ version
 * history), recoveryIndex entries, and the campaign document itself.
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  const charactersRef = collection(db, "campaigns", campaignId, "characters");
  await forEachQueryPage(charactersRef, async (characters) => {
    for (const character of characters) {
      const recoveryCode = (character.data() as { recoveryCode?: string }).recoveryCode;
      await deleteCharacter(campaignId, character.id, recoveryCode);
    }
  });

  await deleteQueryDocsInPages(db, collection(db, "campaigns", campaignId, "sessions"));

  const threadsRef = collection(db, "campaigns", campaignId, "threads");
  await forEachQueryPage(threadsRef, async (threads) => {
    for (const thread of threads) {
      await deleteQueryDocsInPages(
        db,
        collection(db, "campaigns", campaignId, "threads", thread.id, "messages")
      );
    }
    await batchDeleteRefs(
      db,
      threads.map((thread) => thread.ref)
    );
  });

  const customItemsRef = collection(db, "campaigns", campaignId, "customItems");
  await forEachQueryPage(customItemsRef, async (items) => {
    for (const item of items) {
      if ((item.data() as { status?: string }).status !== "archived") {
        await updateDoc(item.ref, {
          status: "archived",
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await deleteQueryDocsInPages(db, collection(item.ref, "versions"));
      await deleteDoc(item.ref);
    }
  });

  await deleteDoc(doc(db, "campaigns", campaignId));
}
