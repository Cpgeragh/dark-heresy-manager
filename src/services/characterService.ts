// src/services/characterService.ts

import {
  arrayUnion,
  getDoc,
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
import { deleteRefsAtomically } from "../utils/firestoreBatchDelete";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { validateCharacterName } from "../utils/validation";
import { stripUndefined } from "../utils/stripUndefined";
import { runSingleFlight } from "../utils/singleFlight";
import { getSpentXp } from "../features/experience/xpSpent";
import {
  assertSafeDestructivePreflight,
  BoundedDeletionCollector,
  type DestructiveOperationPreflight,
} from "../utils/destructiveOperationPreflight";
import {
  assertCharacterImportData,
  assertCharacterPayload,
  assertFirestoreDocumentId,
  assertRecoveryCode,
  assertString,
} from "../utils/firebaseValidation";

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
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
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
  assertCharacterPayload(character, true);

  await runSingleFlight("character:save", [character.campaignId, character.id, character], () => {
    const ref = characterDocRef(character.campaignId, character.id);
    // Converter will ignore `id` and keep `campaignId` in the stored data.
    return setDoc(ref, character);
  });
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
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  const cleanPartial = stripUndefined(partial);
  assertCharacterPayload(cleanPartial);
  await runSingleFlight("character:update", [campaignId, characterId, cleanPartial], () => {
    const ref = characterDocRef(campaignId, characterId);
    return updateDoc(ref, cleanPartial as UpdateData<Character>);
  });
}

/**
 * Repairs the derived XP-spent total from a fresh transactional snapshot.
 * Updating only the nested total avoids overwriting concurrent XP changes.
 */
export async function reconcileCharacterSpentXp(
  campaignId: string,
  characterId: string
): Promise<boolean> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");

  return runSingleFlight("character:reconcile-spent-xp", [campaignId, characterId], () =>
    runTransaction(db, async (transaction) => {
      const reference = characterDocRef(campaignId, characterId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) return false;

      const character = snapshot.data();
      const computedSpent = getSpentXp(character);
      if (character.experience.spent === computedSpent) return false;

      transaction.update(reference, {
        "experience.spent": computedSpent,
      } as UpdateData<Character>);
      return true;
    })
  );
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
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertCharacterPayload({ ...data, campaignId }, true);
  return runSingleFlight("character:create", [campaignId, data], async () => {
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
  });
}

export async function claimCharacter(
  campaignId: string,
  characterId: string,
  ownerId: string
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  assertFirestoreDocumentId(ownerId, "Owner ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:ownership", [campaignId, characterId], async () => {
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
  });
}

export async function releaseCharacter(
  campaignId: string,
  characterId: string,
  previousOwner: string | null
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  if (previousOwner !== null) assertFirestoreDocumentId(previousOwner, "Previous owner ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:ownership", [campaignId, characterId], async () => {
    const charRef = characterDocRef(campaignId, characterId);
    const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

    const batch = writeBatch(db);
    batch.update(charRef, { userId: null, isEditableByPlayer: false });
    batch.set(doc(logsRef), buildClaimLogPayload("release", user.uid, previousOwner, null));
    await batch.commit();
  });
}

export async function forceAssignCharacter(
  campaignId: string,
  characterId: string,
  previousOwner: string | null,
  targetUid: string
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  if (previousOwner !== null) assertFirestoreDocumentId(previousOwner, "Previous owner ID");
  assertFirestoreDocumentId(targetUid, "Target owner ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:ownership", [campaignId, characterId], async () => {
    const charRef = characterDocRef(campaignId, characterId);
    const campaignRef = campaignDocRef(campaignId);
    const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

    const batch = writeBatch(db);
    batch.update(charRef, { userId: targetUid, isEditableByPlayer: true });
    batch.update(campaignRef, { memberIds: arrayUnion(targetUid) });
    batch.set(
      doc(logsRef),
      buildClaimLogPayload("force-assign", user.uid, previousOwner, targetUid)
    );
    await batch.commit();
  });
}

export async function forceReleaseCharacter(
  campaignId: string,
  characterId: string,
  previousOwner: string | null
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  if (previousOwner !== null) assertFirestoreDocumentId(previousOwner, "Previous owner ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:ownership", [campaignId, characterId], async () => {
    const charRef = characterDocRef(campaignId, characterId);
    const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

    const batch = writeBatch(db);
    batch.update(charRef, { userId: null, isEditableByPlayer: false });
    batch.set(doc(logsRef), buildClaimLogPayload("force-release", user.uid, previousOwner, null));
    await batch.commit();
  });
}

interface CharacterDeletionPlan {
  preflight: DestructiveOperationPreflight;
  references: DocumentReference[];
}

async function buildCharacterDeletionPlan(
  campaignId: string,
  characterId: string,
  recoveryCode?: string
): Promise<CharacterDeletionPlan> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  if (recoveryCode !== undefined) assertRecoveryCode(recoveryCode);

  const collector = new BoundedDeletionCollector();
  const characterRef = characterDocRef(campaignId, characterId);
  const characterSnapshot = await getDoc(characterRef);
  collector.addSnapshot(characterSnapshot, "characters");

  if (!characterSnapshot.exists()) {
    return { preflight: collector.result(false), references: [] };
  }

  if (!recoveryCode) {
    return {
      preflight: collector.result(
        true,
        "This character has no usable Recovery Code, so its Recovery Index cannot be removed safely."
      ),
      references: [],
    };
  }

  await collector.addQuery(
    collection(db, "campaigns", campaignId, "characters", characterId, "claimLog"),
    "claimLogs"
  );
  if (!collector.exceeded) {
    await collector.addQuery(
      collection(db, "campaigns", campaignId, "characters", characterId, "xpProposals"),
      "xpProposals"
    );
  }
  if (!collector.exceeded) {
    await collector.addQuery(
      collection(db, "campaigns", campaignId, "threads", characterId, "messages"),
      "messages"
    );
  }

  const threadRef = doc(db, "campaigns", campaignId, "threads", characterId);
  if (!collector.exceeded) collector.addSnapshot(await getDoc(threadRef), "threads");
  if (!collector.exceeded) {
    collector.addSnapshot(
      await getDoc(doc(db, "recoveryIndex", recoveryCode.trim())),
      "recoveryIndex"
    );
  }

  const preflight = collector.result(true);
  return {
    preflight,
    references: preflight.safe ? collector.references() : [],
  };
}

export async function preflightCharacterDeletion(
  campaignId: string,
  characterId: string,
  recoveryCode?: string
): Promise<DestructiveOperationPreflight> {
  return (await buildCharacterDeletionPlan(campaignId, characterId, recoveryCode)).preflight;
}

/**
 * Deletes a character and every known dependent document in one atomic,
 * preflighted batch. Oversized or unindexable deletions wait for Stage 3's
 * protected resumable bulk job instead of leaving partial data behind.
 */
export async function deleteCharacter(
  campaignId: string,
  characterId: string,
  recoveryCode?: string
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  if (recoveryCode !== undefined) assertRecoveryCode(recoveryCode);

  await runSingleFlight("character:delete", [campaignId, characterId], async () => {
    const plan = await buildCharacterDeletionPlan(campaignId, characterId, recoveryCode);
    assertSafeDestructivePreflight(plan.preflight, "Character");
    await deleteRefsAtomically(db, plan.references);
  });
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
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertCharacterImportData(data);
  const serialisedData = JSON.stringify(data);
  if (new TextEncoder().encode(serialisedData).byteLength > PRODUCT_LIMITS.characterImportBytes) {
    throw new Error("Character file is too large to import.");
  }

  const importedName = (data.header as Record<string, unknown> | undefined)?.characterName;
  if (typeof importedName !== "string") {
    throw new Error("Character file is missing a character name.");
  }
  const nameValidation = validateCharacterName(importedName);
  if (!nameValidation.isValid) throw new Error(nameValidation.error);

  return runSingleFlight("character:import", [campaignId, serialisedData], async () => {
    const recoveryCode = generateRecoveryCode();
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...portableData } = data;
    const importData = {
      ...portableData,
      campaignId,
      userId: null,
      isEditableByPlayer: false,
      recoveryCode,
      header: {
        ...(data.header as Record<string, unknown>),
        characterName: importedName.trim(),
      },
    };
    assertCharacterPayload(importData, true);
    // Imported JSON is deliberately written through a plain reference because it is
    // only structurally known after import validation, not as a compile-time Character.
    const charRef = doc(collection(db, "campaigns", campaignId, "characters"));
    const batch = writeBatch(db);
    batch.set(charRef, importData);
    batch.set(doc(db, "recoveryIndex", recoveryCode), { campaignId, characterId: charRef.id });
    await batch.commit();

    return importedName.trim();
  });
}

/**
 * Creates a new empty character in a campaign with a recovery code.
 * Returns the recovery code so the caller can display it to the DM.
 */
export async function createNewCharacter(campaignId: string, name: string): Promise<string> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertString(name, "Character name");
  const trimmedName = name.trim();
  const validation = validateCharacterName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);

  return runSingleFlight("character:create-empty", [campaignId, trimmedName], async () => {
    const recoveryCode = generateRecoveryCode();
    const characterData = createEmptyCharacterData({
      campaignId,
      recoveryCode,
      userId: null,
      characterName: trimmedName,
    });
    const charRef = doc(charactersCollectionRef(campaignId));
    const character: Character = { ...characterData, id: charRef.id };
    assertCharacterPayload(character, true);
    const recoveryRef = doc(db, "recoveryIndex", recoveryCode);
    const batch = writeBatch(db);
    batch.set(charRef, character);
    batch.set(recoveryRef, { campaignId, characterId: charRef.id });
    await batch.commit();

    return recoveryCode;
  });
}
