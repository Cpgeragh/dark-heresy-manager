// src/services/campaignService.ts
// Firestore operations for campaign documents.

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
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

/**
 * Deletes a campaign and all its subcollection data atomically.
 * Cleans up: characters (+ their claimLog / xpProposals), sessions,
 * recoveryIndex entries, and the campaign document itself.
 *
 * Note: Firestore batches are capped at 500 ops. This is safe for typical
 * campaigns (≤ ~30 characters, ≤ ~50 sessions). Very large campaigns would
 * need chunked batches — not a concern at current scale.
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  const batch = writeBatch(db);

  // ── Characters ─────────────────────────────────────────────────────────────
  const charactersSnap = await getDocs(
    collection(db, "campaigns", campaignId, "characters")
  );

  for (const charDoc of charactersSnap.docs) {
    // claimLog subcollection
    const claimLogSnap = await getDocs(
      collection(db, "campaigns", campaignId, "characters", charDoc.id, "claimLog")
    );
    claimLogSnap.docs.forEach((d) => batch.delete(d.ref));

    // xpProposals subcollection
    const xpProposalsSnap = await getDocs(
      collection(db, "campaigns", campaignId, "characters", charDoc.id, "xpProposals")
    );
    xpProposalsSnap.docs.forEach((d) => batch.delete(d.ref));

    // recoveryIndex entry
    const recoveryCode = (charDoc.data() as { recoveryCode?: string }).recoveryCode;
    if (recoveryCode) {
      batch.delete(doc(db, "recoveryIndex", recoveryCode));
    }

    // character document
    batch.delete(charDoc.ref);
  }

  // ── Sessions ────────────────────────────────────────────────────────────────
  const sessionsSnap = await getDocs(
    collection(db, "campaigns", campaignId, "sessions")
  );
  sessionsSnap.docs.forEach((d) => batch.delete(d.ref));

  // ── Campaign document ───────────────────────────────────────────────────────
  batch.delete(doc(db, "campaigns", campaignId));

  await batch.commit();
}
