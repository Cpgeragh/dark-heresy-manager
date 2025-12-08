// src/services/characterService.ts

import {
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import {
  characterDocRef,
  charactersCollectionRef,
} from "../firebase/converters";

import type { Character } from "../types/Character";


// ------------------------------------------------------------
// Load a character (typed)
// ------------------------------------------------------------
export async function loadCharacter(
  campaignId: string,
  characterId: string
): Promise<Character | null> {
  const snap = await getDoc(characterDocRef(campaignId, characterId));
  return snap.exists() ? snap.data()! : null;
}


// ------------------------------------------------------------
// Save (overwrite) the entire character
// ------------------------------------------------------------
export async function saveCharacter(
  campaignId: string,
  character: Character
): Promise<void> {
  if (!character.id) throw new Error("Character must have id");

  const ref = characterDocRef(campaignId, character.id);
  await setDoc(ref, character);
}


// ------------------------------------------------------------
// Patch update on the character
// ------------------------------------------------------------
export async function updateCharacter(
  campaignId: string,
  characterId: string,
  partial: Partial<Character>
): Promise<void> {
  const ref = characterDocRef(campaignId, characterId);
  await updateDoc(ref, partial);
}


// ------------------------------------------------------------
// Field-level update (fine-grained stat updates)
// ------------------------------------------------------------
export async function updateCharacterField(
  campaignId: string,
  characterId: string,
  path: string,
  value: any
): Promise<void> {
  const ref = characterDocRef(campaignId, characterId);
  await updateDoc(ref, { [path]: value });
}


// ------------------------------------------------------------
// Create a new character
// ------------------------------------------------------------
export async function createCharacter(
  campaignId: string,
  data: Omit<Character, "id">
): Promise<string> {
  const ref = await addDoc(charactersCollectionRef(campaignId), data);
  return ref.id;
}


// ------------------------------------------------------------
// List all characters in a campaign
// ------------------------------------------------------------
export async function listCharacters(
  campaignId: string
): Promise<Character[]> {
  const snap = await getDocs(charactersCollectionRef(campaignId));
  return snap.docs.map((d) => d.data());
}


// ------------------------------------------------------------
// Realtime listener for UI auto-updates
// ------------------------------------------------------------
export function watchCharacter(
  campaignId: string,
  characterId: string,
  callback: (char: Character | null) => void
) {
  return onSnapshot(characterDocRef(campaignId, characterId), (snap) => {
    callback(snap.exists() ? snap.data()! : null);
  });
}