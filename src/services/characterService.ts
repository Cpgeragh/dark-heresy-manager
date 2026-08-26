// src/services/characterService.ts

import {
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
  writeBatch,
  collection,
  doc,
  type UpdateData,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, auth, functions } from "../firebase";
import {
  characterDocRef,
  charactersCollectionRef,
  characterSummaryDocRef,
} from "../firebase/converters";

import type { Character } from "../types/Character";
import type { CharacterSummaryWithId } from "../types/Firestore";
import { createEmptyCharacterData } from "../utils/characterFactory";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { validateCharacterName } from "../utils/validation";
import { stripUndefined } from "../utils/stripUndefined";
import { runSingleFlight } from "../utils/singleFlight";
import { getSpentXp } from "../features/experience/xpSpent";
import { driveJobToCompletion } from "../utils/bulkJobClient";
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
 * Derives the restricted character-summary shape from a full character.
 * Never includes the Recovery Code or any other sheet data.
 */
export function computeCharacterSummary(character: Character): CharacterSummaryWithId {
  return stripUndefined({
    id: character.id,
    campaignId: character.campaignId,
    characterName: character.header.characterName,
    playerName: character.header.playerName,
    career: character.header.career,
    rank: character.header.rank,
    portraitUrl: character.portraitUrl,
  }) as CharacterSummaryWithId;
}

/** True when a partial character write touches a field the summary carries. */
function touchesCharacterSummary(partial: Partial<Character>): boolean {
  return "header" in partial || "portraitUrl" in partial;
}

/**
 * Reads the current character, applies a partial on top, and writes both
 * the character and its derived summary atomically. Used whenever a write
 * touches a summary-relevant field, so the summary is never left out of
 * date or missing required fields, regardless of what's already stored.
 */
export async function writeCharacterFieldsWithSummary(
  campaignId: string,
  characterId: string,
  partial: Partial<Character>
): Promise<void> {
  const ref = characterDocRef(campaignId, characterId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("Character not found.");
    const merged = { ...snapshot.data(), ...partial } as Character;
    transaction.update(ref, partial as UpdateData<Character>);
    transaction.set(characterSummaryDocRef(campaignId, characterId), computeCharacterSummary(merged));
  });
}

/**
 * Recomputes and rewrites every character's summary in a campaign, in one
 * batch. For characters created before Stage 7, or any summary that's
 * drifted out of sync. A campaign is capped at 100 characters, comfortably
 * inside Firestore's 500-write batch limit.
 */
export async function repairCharacterSummaries(campaignId: string): Promise<number> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  return runSingleFlight("character:repair-summaries", [campaignId], async () => {
    const snapshot = await getDocs(charactersCollectionRef(campaignId));
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnapshot) => {
      const character = docSnapshot.data();
      batch.set(characterSummaryDocRef(campaignId, character.id), computeCharacterSummary(character));
    });
    await batch.commit();

    return snapshot.docs.length;
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
    if (touchesCharacterSummary(cleanPartial)) {
      return writeCharacterFieldsWithSummary(campaignId, characterId, cleanPartial);
    }
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

const callClaimCharacter = httpsCallable<{ code: string }, { campaignId: string; characterId: string }>(
  functions,
  "claimCharacter"
);

export async function claimCharacter(
  code: string
): Promise<{ campaignId: string; characterId: string }> {
  assertRecoveryCode(code);
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  return runSingleFlight("character:claim", [code], async () => {
    const { data } = await callClaimCharacter({ code: code.trim() });
    return data;
  });
}

const callReleaseCharacter = httpsCallable<{ campaignId: string; characterId: string }, void>(
  functions,
  "releaseCharacter"
);

export async function releaseCharacter(campaignId: string, characterId: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:release", [campaignId, characterId], async () => {
    await callReleaseCharacter({ campaignId, characterId });
  });
}

const callForceReleaseCharacter = httpsCallable<{ campaignId: string; characterId: string }, void>(
  functions,
  "forceReleaseCharacter"
);

export async function forceReleaseCharacter(campaignId: string, characterId: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:force-release", [campaignId, characterId], async () => {
    await callForceReleaseCharacter({ campaignId, characterId });
  });
}

const callForceAssignCharacter = httpsCallable<
  { campaignId: string; characterId: string; targetUid: string },
  void
>(functions, "forceAssignCharacter");

export async function forceAssignCharacter(
  campaignId: string,
  characterId: string,
  targetUid: string
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  assertFirestoreDocumentId(targetUid, "Target owner ID");
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  await runSingleFlight("character:force-assign", [campaignId, characterId, targetUid], async () => {
    await callForceAssignCharacter({ campaignId, characterId, targetUid });
  });
}

const callStartCharacterDeletionJob = httpsCallable<
  { campaignId: string; characterId: string },
  { jobId: string; totalCount: number }
>(functions, "startCharacterDeletionJob");

const callProcessCharacterDeletionChunk = httpsCallable<
  { jobId: string },
  { done: boolean; processedCount: number; totalCount: number }
>(functions, "processCharacterDeletionChunk");

/**
 * Starts a resumable character-deletion job and returns its exact document
 * count, without deleting anything yet — the preview step for a delete
 * confirmation. Pass the returned jobId to deleteCharacter to run it.
 */
export async function preflightCharacterDeletion(
  campaignId: string,
  characterId: string
): Promise<{ jobId: string; totalCount: number }> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  const { data } = await callStartCharacterDeletionJob({ campaignId, characterId });
  return data;
}

/**
 * Drives a character-deletion job (from preflightCharacterDeletion) to
 * completion via the resumable startCharacterDeletionJob/
 * processCharacterDeletionChunk Functions, chunked and resumable if a call
 * drops mid-way. onProgress, if given, is called after each chunk.
 */
export async function deleteCharacter(
  jobId: string,
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void
): Promise<void> {
  await runSingleFlight("character:delete", [jobId], () =>
    driveJobToCompletion(
      jobId,
      async (id) => (await callProcessCharacterDeletionChunk({ jobId: id })).data,
      (chunk) => onProgress?.({ processedCount: chunk.processedCount, totalCount: chunk.totalCount })
    )
  );
}

const callRegisterRecoveryCode = httpsCallable<
  { campaignId: string; characterId: string },
  { code: string }
>(functions, "registerRecoveryCode");

/** Generates (or regenerates) a character's Recovery Code via the protected server-side operation. */
export async function registerRecoveryCode(campaignId: string, characterId: string): Promise<string> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  const { data } = await callRegisterRecoveryCode({ campaignId, characterId });
  return data.code;
}

const callRevokeRecoveryCode = httpsCallable<{ campaignId: string; characterId: string }, void>(
  functions,
  "revokeRecoveryCode"
);

/** Invalidates a character's current Recovery Code without issuing a replacement. */
export async function revokeRecoveryCode(campaignId: string, characterId: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  await callRevokeRecoveryCode({ campaignId, characterId });
}

const REGISTER_CODE_RETRY_ATTEMPTS = 3;

/**
 * Character creation and code registration are no longer atomic (the code is
 * generated server-side). Retries a few times to smooth over a transient
 * Function failure right after creation; if every attempt fails, the caller
 * can still generate a code later from the character's own menu.
 */
async function registerRecoveryCodeAfterCreate(
  campaignId: string,
  characterId: string
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= REGISTER_CODE_RETRY_ATTEMPTS; attempt++) {
    try {
      return await registerRecoveryCode(campaignId, characterId);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    "Character was created, but generating its Recovery Code failed. Open the character's menu to generate one.",
    { cause: lastError }
  );
}

/**
 * Imports a character from a parsed JSON object into a campaign, then
 * registers its Recovery Code. Returns the imported character's name.
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
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...portableData } = data;
    const importData = {
      ...portableData,
      campaignId,
      userId: null,
      isEditableByPlayer: false,
      recoveryCode: "",
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
    batch.set(
      characterSummaryDocRef(campaignId, charRef.id),
      computeCharacterSummary({ ...importData, id: charRef.id } as Character)
    );
    await batch.commit();

    await registerRecoveryCodeAfterCreate(campaignId, charRef.id);
    return importedName.trim();
  });
}

/**
 * Creates a new empty character in a campaign, then registers its Recovery
 * Code. Returns the recovery code so the caller can display it to the DM.
 */
export async function createNewCharacter(campaignId: string, name: string): Promise<string> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertString(name, "Character name");
  const trimmedName = name.trim();
  const validation = validateCharacterName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);

  return runSingleFlight("character:create-empty", [campaignId, trimmedName], async () => {
    const characterData = createEmptyCharacterData({
      campaignId,
      userId: null,
      characterName: trimmedName,
    });
    const charRef = doc(charactersCollectionRef(campaignId));
    const character: Character = { ...characterData, id: charRef.id };
    assertCharacterPayload(character, true);
    const batch = writeBatch(db);
    batch.set(charRef, character);
    batch.set(characterSummaryDocRef(campaignId, charRef.id), computeCharacterSummary(character));
    await batch.commit();

    return registerRecoveryCodeAfterCreate(campaignId, charRef.id);
  });
}
