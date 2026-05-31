// src/services/userService.ts
// Firestore operations for user documents.

import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Persists the user's active campaign selection to Firestore.
 * Uses merge so other user fields are not overwritten.
 */
export async function updateActiveCampaign(
  userId: string,
  campaignId: string | null
): Promise<void> {
  await setDoc(doc(db, "users", userId), { activeCampaignId: campaignId }, { merge: true });
}
