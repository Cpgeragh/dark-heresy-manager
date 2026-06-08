// src/services/xpService.ts
// Firestore operations for XP proposals (subcollection of a character document).

import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db, auth } from "../firebase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function proposalsRef(campaignId: string, characterId: string) {
  return collection(db, "campaigns", campaignId, "characters", characterId, "xpProposals");
}

function proposalDocRef(campaignId: string, characterId: string, proposalId: string) {
  return doc(proposalsRef(campaignId, characterId), proposalId);
}

function characterPlainRef(campaignId: string, characterId: string) {
  return doc(db, "campaigns", campaignId, "characters", characterId);
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Submit an XP spend proposal on behalf of the currently signed-in player.
 * Throws if no user is authenticated.
 */
export async function proposeXpSpend(
  campaignId: string,
  characterId: string,
  description: string,
  xpCost: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("proposeXpSpend: not signed in.");

  await addDoc(proposalsRef(campaignId, characterId), {
    playerId: user.uid,
    description,
    xpCost,
    status: "pending",
    proposedAt: serverTimestamp(),
  });
}

/**
 * Approve a pending XP proposal.
 * Atomically marks it approved and increments experience.spent on the character.
 */
export async function approveXpProposal(
  campaignId: string,
  characterId: string,
  proposalId: string,
  xpCost: number
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(proposalDocRef(campaignId, characterId, proposalId), {
    status: "approved",
  });
  batch.update(characterPlainRef(campaignId, characterId), {
    "experience.spent": increment(xpCost),
  });
  await batch.commit();
}

/**
 * Reject a pending XP proposal.
 */
export async function rejectXpProposal(
  campaignId: string,
  characterId: string,
  proposalId: string
): Promise<void> {
  await updateDoc(proposalDocRef(campaignId, characterId, proposalId), {
    status: "rejected",
  });
}
