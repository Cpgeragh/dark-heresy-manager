// src/utils/campaignActions.ts

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Soft-deletes a campaign by stamping archivedAt with the current server time.
 * Archived campaigns are excluded from all active CampaignsContext queries
 * via where("archivedAt", "==", null).
 */
export async function archiveCampaign(campaignId: string): Promise<void> {
  await updateDoc(doc(db, "campaigns", campaignId), {
    archivedAt: serverTimestamp(),
  });
}

/**
 * Restores an archived campaign by clearing archivedAt back to null.
 * The campaign will reappear in all active CampaignsContext queries.
 */
export async function restoreCampaign(campaignId: string): Promise<void> {
  await updateDoc(doc(db, "campaigns", campaignId), {
    archivedAt: null,
  });
}
