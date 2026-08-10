// src/services/campaignService.ts
// Firestore operations for campaign documents.

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";
import { batchDeleteRefs } from "../utils/firestoreBatchDelete";

/**
 * Creates a new campaign owned by the given DM.
 * Returns the new campaign's Firestore document ID.
 */
export async function createCampaign(name: string, dmId: string): Promise<string> {
  const newRef = doc(collection(db, "campaigns"));

  const campaignData: CampaignDocument = {
    name,
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
  await updateDoc(doc(db, "campaigns", campaignId), { name });
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
  const refs: DocumentReference[] = [];

  // ── Characters + their claim logs and XP proposals ──────────────────────────
  const charactersSnap = await getDocs(collection(db, "campaigns", campaignId, "characters"));

  for (const charDoc of charactersSnap.docs) {
    const claimLogSnap = await getDocs(
      collection(db, "campaigns", campaignId, "characters", charDoc.id, "claimLog")
    );
    claimLogSnap.docs.forEach((d) => refs.push(d.ref));

    const xpProposalsSnap = await getDocs(
      collection(db, "campaigns", campaignId, "characters", charDoc.id, "xpProposals")
    );
    xpProposalsSnap.docs.forEach((d) => refs.push(d.ref));

    const recoveryCode = (charDoc.data() as { recoveryCode?: string }).recoveryCode;
    if (recoveryCode) {
      refs.push(doc(db, "recoveryIndex", recoveryCode));
    }

    refs.push(charDoc.ref);
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  const sessionsSnap = await getDocs(collection(db, "campaigns", campaignId, "sessions"));
  sessionsSnap.docs.forEach((d) => refs.push(d.ref));

  // ── Message threads + their messages ─────────────────────────────────────
  const threadsSnap = await getDocs(collection(db, "campaigns", campaignId, "threads"));
  for (const threadDoc of threadsSnap.docs) {
    const messagesSnap = await getDocs(
      collection(db, "campaigns", campaignId, "threads", threadDoc.id, "messages")
    );
    messagesSnap.docs.forEach((d) => refs.push(d.ref));
    refs.push(threadDoc.ref);
  }

  // ── Custom item library + version history ────────────────────────────────
  const customItemsSnap = await getDocs(collection(db, "campaigns", campaignId, "customItems"));
  for (const itemDoc of customItemsSnap.docs) {
    const versionsSnap = await getDocs(
      collection(db, "campaigns", campaignId, "customItems", itemDoc.id, "versions")
    );
    versionsSnap.docs.forEach((d) => refs.push(d.ref));
    refs.push(itemDoc.ref);
  }

  // ── Campaign document ─────────────────────────────────────────────────────
  refs.push(doc(db, "campaigns", campaignId));

  await batchDeleteRefs(db, refs);
}
