// src/services/characterService.ts

import {
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import {
  characterDocRef,
  charactersCollectionRef,
} from "../firebase/converters";

import type { Character } from "../types/Character";

/**
 * Load a single character with full typing.
 * Returns undefined if the doc does not exist.
 */
export async function loadCharacter(
  campaignId: string,
  characterId: string
): Promise<Character | undefined> {
  const snap = await getDoc(characterDocRef(campaignId, characterId));
  return snap.data();
}

/**
 * Save (overwrite) a full character document.
 *
 * Assumes:
 * - character.id is the Firestore document id
 * - character.campaignId matches the campaign path
 */
export async function saveCharacter(character: Character): Promise<void> {
  if (!character.id) {
    throw new Error("saveCharacter: Character must have an id");
  }

  const ref = characterDocRef(character.campaignId, character.id);
  await setDoc(ref, character);
}

/**
 * Patch update a character document with a partial object.
 * Only the fields in `partial` will be updated.
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
 * Create a new character document from a payload that has no `id`.
 *
 * Returns the full Character object including the generated id.
 */
export async function createCharacter(
  campaignId: string,
  data: Omit<Character, "id">
): Promise<Character> {
  const colRef = charactersCollectionRef(campaignId);

  // Ensure campaignId inside the payload matches the path
  const payload: Omit<Character, "id"> = {
    ...data,
    campaignId,
  };

  const docRef = await addDoc(colRef, payload);
  const snap = await getDoc(docRef);

  const stored = snap.data();
  if (!stored) {
    // This should not happen, but keeps typing sane
    return {
      id: docRef.id,
      ...(payload as Omit<Character, "id">),
    };
  }

  return {
    id: docRef.id,
    ...(stored as Omit<Character, "id">),
  };
}