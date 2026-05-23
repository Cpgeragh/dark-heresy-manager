// src/services/characterService.ts

import {
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  writeBatch,
  collection,
  doc,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import {
  characterDocRef,
  charactersCollectionRef,
} from "../firebase/converters";

import type { Character } from "../types/Character";
import { buildClaimLogPayload } from "../utils/claimLog";

/**
 * Load a single character with full typing.
 * Returns undefined if the doc does not exist.
 *
 * Converter:
 * - strips id on write
 * - adds id on read
 * - keeps campaignId stored in Firestore
 */
export async function loadCharacter(
  campaignId: string,
  characterId: string
): Promise<Character | undefined> {
  const snap = await getDoc(characterDocRef(campaignId, characterId));
  return snap.data() ?? undefined;
}

/**
 * Save (overwrite) a full character document.
 *
 * Assumes:
 * - character.id is the Firestore document id
 * - character.campaignId matches the campaign path
 *
 * Converter will strip `id` when writing, but TypeScript still
 * wants a full Character here (which is exactly what we have).
 */
export async function saveCharacter(character: Character): Promise<void> {
  if (!character.id) {
    throw new Error("saveCharacter: Character must have an id");
  }

  const ref = characterDocRef(character.campaignId, character.id);

  // Converter will ignore `id` and keep `campaignId` in the stored data.
  await setDoc(ref, character);
}

/**
 * Patch update a character document with a partial object.
 * Only the fields in `partial` will be updated.
 *
 * We pass Partial<Character> and let Firestore handle it.
 * `id` in partial (if present) is ignored by the converter.
 */
export async function updateCharacter(
  campaignId: string,
  characterId: string,
  partial: Partial<Character>
): Promise<void> {
  const ref = characterDocRef(campaignId, characterId);
  await updateDoc(ref, partial as any);
}

/**
 * Create a new character document.
 *
 * - Caller provides everything *except* id and campaignId.
 * - Service injects campaignId.
 * - Converter strips id (we pass an empty string just to satisfy types).
 * - Firestore assigns the real id, which converter adds on read.
 */
export async function createCharacter(
  campaignId: string,
  data: Omit<Character, "id" | "campaignId">
): Promise<Character> {
  const colRef = charactersCollectionRef(campaignId);

  // Build a full Character object for TypeScript,
  // but use a dummy id; converter will strip it.
  const toStore: Character = {
    ...data,
    campaignId,
    id: "", // placeholder, ignored by converter.toFirestore
  };

  const docRef = await addDoc(colRef, toStore);

  // Re-fetch to get the typed document (with real id)
  const snap = await getDoc(docRef);
  const stored = snap.data();

  if (!stored) {
    throw new Error("Failed to create character");
  }

  return stored;
}

export async function forceAssignCharacter(
  campaignId: string,
  characterId: string,
  previousOwner: string | null,
  targetUid: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  const charRef = characterDocRef(campaignId, characterId);
  const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

  const batch = writeBatch(db);
  batch.update(charRef, { userId: targetUid, isEditableByPlayer: true });
  batch.set(doc(logsRef), buildClaimLogPayload("force-assign", user.uid, previousOwner, targetUid));
  await batch.commit();
}

export async function forceReleaseCharacter(
  campaignId: string,
  characterId: string,
  previousOwner: string | null
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  const charRef = characterDocRef(campaignId, characterId);
  const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

  const batch = writeBatch(db);
  batch.update(charRef, { userId: null, isEditableByPlayer: false });
  batch.set(doc(logsRef), buildClaimLogPayload("force-release", user.uid, previousOwner, null));
  await batch.commit();
}