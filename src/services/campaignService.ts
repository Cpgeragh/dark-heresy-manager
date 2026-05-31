// src/services/campaignService.ts
// Firestore operations for campaign documents.

import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";

/**
 * Creates a new campaign owned by the given DM.
 * Returns the new campaign's Firestore document ID.
 */
export async function createCampaign(name: string, dmId: string): Promise<string> {
  const newRef = doc(collection(db, "campaigns"));

  const campaignData: CampaignDocument = {
    name,
    dmId,
    createdAt: new Date(),
  };

  await setDoc(newRef, campaignData);
  return newRef.id;
}

/**
 * Updates the name of an existing campaign.
 */
export async function updateCampaignName(campaignId: string, name: string): Promise<void> {
  await updateDoc(doc(db, "campaigns", campaignId), { name });
}
