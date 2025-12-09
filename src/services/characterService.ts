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
 * Load a character.
 */
export async function loadCharacter(
  campaignId: string,
  characterId: string
): Promise<Character | undefined> {
  const snap = await getDoc(characterDocRef(campaignId, characterId));
  const data = snap.data();

  if (!data) return undefined;

  return {
    ...data,
    id: snap.id,
  };
}

/**
 * Save (overwrite) a character.
 * Converter strips id automatically.
 */
export async function saveCharacter(character: Character): Promise<void> {
  if (!character.id) throw new Error("saveCharacter: missing id");

  const ref = characterDocRef(character.campaignId, character.id);
  await setDoc(ref, character);
}

/**
 * Patch update.
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
 * Create a new character.
 */
export async function createCharacter(
  campaignId: string,
  data: Omit<Character, "id">
): Promise<Character> {
  const colRef = charactersCollectionRef(campaignId);

  // Write the document
  const docRef = await addDoc(colRef, data);

  // Fetch the typed version
  const snap = await getDoc(docRef);
  const stored = snap.data();

  if (!stored) throw new Error("Character creation failed");

  return {
    ...stored,
    id: docRef.id,
  };
}