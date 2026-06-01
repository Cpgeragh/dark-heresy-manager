// src/services/characterService.ts

import {
  arrayUnion,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  writeBatch,
  collection,
  doc,
  type UpdateData,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import {
  characterDocRef,
  charactersCollectionRef,
} from "../firebase/converters";

import type { Character } from "../types/Character";
import { buildClaimLogPayload } from "../utils/claimLog";
import { generateRecoveryCode } from "../utils/recoveryCode";
import { createEmptyCharacterData } from "../utils/characterFactory";

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
  await updateDoc(ref, partial as UpdateData<Character>);
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
  const campaignRef = doc(db, "campaigns", campaignId);
  const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

  const batch = writeBatch(db);
  batch.update(charRef, { userId: targetUid, isEditableByPlayer: true });
  batch.update(campaignRef, { memberIds: arrayUnion(targetUid) });
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

/**
 * Deletes a character and its recovery index entry atomically.
 */
export async function deleteCharacter(
  campaignId: string,
  characterId: string,
  recoveryCode: string
): Promise<void> {
  const charRef = doc(db, "campaigns", campaignId, "characters", characterId);
  const recoveryRef = doc(db, "recoveryIndex", recoveryCode);
  const batch = writeBatch(db);
  batch.delete(charRef);
  batch.delete(recoveryRef);
  await batch.commit();
}

/**
 * Clones a character within a campaign.
 * Generates a new recovery code, copies all data, and registers the clone
 * in the recovery index atomically.
 * Returns the clone's character name.
 */
export async function cloneCharacter(
  campaignId: string,
  characterId: string
): Promise<string> {
  const sourceRef = doc(db, "campaigns", campaignId, "characters", characterId);
  const sourceSnap = await getDoc(sourceRef);
  if (!sourceSnap.exists()) throw new Error("Source character not found.");

  const sourceData = sourceSnap.data();
  const originalName = sourceData.header?.characterName ?? "Unnamed Character";
  const cloneName = `Copy of ${originalName}`;
  const recoveryCode = generateRecoveryCode();

  const cloneData = {
    ...sourceData,
    userId: null,
    isEditableByPlayer: false,
    recoveryCode,
    header: { ...sourceData.header, characterName: cloneName },
  };

  const newCharRef = doc(collection(db, "campaigns", campaignId, "characters"));
  const batch = writeBatch(db);
  batch.set(newCharRef, cloneData);
  batch.set(doc(db, "recoveryIndex", recoveryCode), { campaignId, characterId: newCharRef.id });
  await batch.commit();

  return cloneName;
}

/**
 * Imports a character from a parsed JSON object into a campaign.
 * Assigns a fresh recovery code and registers it in the recovery index.
 * Returns the imported character's name.
 */
export async function importCharacter(
  campaignId: string,
  data: Record<string, unknown>
): Promise<string> {
  const recoveryCode = generateRecoveryCode();
  const importData = { ...data, userId: null, isEditableByPlayer: false, recoveryCode };
  const charRef = doc(collection(db, "campaigns", campaignId, "characters"));
  const batch = writeBatch(db);
  batch.set(charRef, importData);
  batch.set(doc(db, "recoveryIndex", recoveryCode), { campaignId, characterId: charRef.id });
  await batch.commit();

  const name = (data.header as Record<string, unknown>)?.characterName;
  return typeof name === "string" ? name : "character";
}

/**
 * Creates a new empty character in a campaign with a recovery code.
 * Returns the recovery code so the caller can display it to the DM.
 */
export async function createNewCharacter(
  campaignId: string,
  name: string
): Promise<string> {
  const recoveryCode = generateRecoveryCode();
  const characterData = createEmptyCharacterData({ campaignId, recoveryCode, userId: null, characterName: name });
  const charRef = doc(collection(db, "campaigns", campaignId, "characters"));
  const recoveryRef = doc(db, "recoveryIndex", recoveryCode);
  const batch = writeBatch(db);
  batch.set(charRef, characterData);
  batch.set(recoveryRef, { campaignId, characterId: charRef.id });
  await batch.commit();

  return recoveryCode;
}