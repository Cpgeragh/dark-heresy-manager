// src/services/characterService.ts

import {
  arrayUnion,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
  addDoc,
  writeBatch,
  collection,
  doc,
  type DocumentReference,
  type UpdateData,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import { campaignDocRef, characterDocRef, charactersCollectionRef } from "../firebase/converters";

import type { Character } from "../types/Character";
import { buildClaimLogPayload } from "../utils/claimLog";
import { generateRecoveryCode } from "../utils/recoveryCode";
import { createEmptyCharacterData } from "../utils/characterFactory";
import { batchDeleteRefs } from "../utils/firestoreBatchDelete";

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

export async function claimCharacter(
  campaignId: string,
  characterId: string,
  ownerId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  const charRef = characterDocRef(campaignId, characterId);
  const campaignRef = campaignDocRef(campaignId);
  const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

  await runTransaction(db, async (transaction) => {
    const charDoc = await transaction.get(charRef);

    if (!charDoc.exists()) {
      throw new Error("Character does not exist.");
    }

    if (charDoc.data().userId) {
      throw new Error("Character is already claimed.");
    }

    transaction.update(charRef, { userId: ownerId });
    transaction.update(campaignRef, { memberIds: arrayUnion(ownerId) });
    transaction.set(doc(logsRef), buildClaimLogPayload("claim", user.uid, null, ownerId));
  });
}

export async function releaseCharacter(
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
  batch.set(doc(logsRef), buildClaimLogPayload("release", user.uid, previousOwner, null));
  await batch.commit();
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
  const campaignRef = campaignDocRef(campaignId);
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
 * Deletes a character and everything tied to it: its claim log, XP
 * proposals, message thread (+ messages), recovery index entry, and the
 * character document itself.
 */
export async function deleteCharacter(
  campaignId: string,
  characterId: string,
  recoveryCode: string
): Promise<void> {
  const refs: DocumentReference[] = [];

  const claimLogSnap = await getDocs(
    collection(db, "campaigns", campaignId, "characters", characterId, "claimLog")
  );
  claimLogSnap.docs.forEach((d) => refs.push(d.ref));

  const xpProposalsSnap = await getDocs(
    collection(db, "campaigns", campaignId, "characters", characterId, "xpProposals")
  );
  xpProposalsSnap.docs.forEach((d) => refs.push(d.ref));

  const messagesSnap = await getDocs(
    collection(db, "campaigns", campaignId, "threads", characterId, "messages")
  );
  messagesSnap.docs.forEach((d) => refs.push(d.ref));
  refs.push(doc(db, "campaigns", campaignId, "threads", characterId));

  refs.push(doc(db, "recoveryIndex", recoveryCode));
  refs.push(characterDocRef(campaignId, characterId));

  await batchDeleteRefs(db, refs);
}

/**
 * Clones a character within a campaign.
 * Generates a new recovery code, copies all data, and registers the clone
 * in the recovery index atomically.
 * Returns the clone's character name.
 */
export async function cloneCharacter(campaignId: string, characterId: string): Promise<string> {
  const sourceRef = characterDocRef(campaignId, characterId);
  const sourceSnap = await getDoc(sourceRef);
  if (!sourceSnap.exists()) throw new Error("Source character not found.");

  const sourceData = sourceSnap.data()!; // typed as Character
  const originalName = sourceData.header?.characterName ?? "Unnamed Character";
  const cloneName = `Copy of ${originalName}`;
  const recoveryCode = generateRecoveryCode();

  const newCharRef = doc(charactersCollectionRef(campaignId));
  const cloneData: Character = {
    ...sourceData,
    id: newCharRef.id,
    userId: null,
    isEditableByPlayer: false,
    recoveryCode,
    header: { ...sourceData.header, characterName: cloneName },
  };

  const batch = writeBatch(db);
  batch.set(newCharRef, cloneData); // converter strips id on write
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
  // Imported JSON is deliberately written through a plain reference because it is
  // only structurally known after import validation, not as a compile-time Character.
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
export async function createNewCharacter(campaignId: string, name: string): Promise<string> {
  const recoveryCode = generateRecoveryCode();
  const characterData = createEmptyCharacterData({
    campaignId,
    recoveryCode,
    userId: null,
    characterName: name,
  });
  const charRef = doc(charactersCollectionRef(campaignId));
  const character: Character = { ...characterData, id: charRef.id };
  const recoveryRef = doc(db, "recoveryIndex", recoveryCode);
  const batch = writeBatch(db);
  batch.set(charRef, character);
  batch.set(recoveryRef, { campaignId, characterId: charRef.id });
  await batch.commit();

  return recoveryCode;
}
