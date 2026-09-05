// functions/src/operations/patchCharacterField.ts
//
// Generic dispatcher for narrowly scoped character field patches. Loads the
// document, checks the same DM-or-editable-player authorization used by the
// Firestore rules, validates each new value with its trusted server-side
// validator, and writes transactionally. Only fields with a registered
// validator in characterFieldValidation.ts can be patched this way.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCanEditCharacter } from "../shared/characterAuthorization.js";
import { assertValidCharacterFieldValue } from "../shared/characterFieldValidation.js";
import { computeCharacterSummary, isSummaryRelevantField } from "../shared/characterSummary.js";

export interface PatchCharacterFieldInput {
  campaignId: string;
  characterId: string;
  field?: string;
  value?: unknown;
  fields?: Record<string, unknown>;
  operationId?: string;
}

function normalizePatch(input: PatchCharacterFieldInput): Record<string, unknown> {
  if (input.fields !== undefined) {
    if (input.field !== undefined || input.value !== undefined) {
      throw new HttpsError(
        "invalid-argument",
        "Provide either field and value, or fields, not both."
      );
    }
    if (typeof input.fields !== "object" || input.fields === null || Array.isArray(input.fields)) {
      throw new HttpsError("invalid-argument", "fields must be an object.");
    }
    if (Object.keys(input.fields).length === 0) {
      throw new HttpsError("invalid-argument", "fields cannot be empty.");
    }
    return input.fields;
  }
  if (input.field === undefined) {
    throw new HttpsError("invalid-argument", "Missing field or fields.");
  }
  return { [input.field]: input.value };
}

export async function patchCharacterField(
  input: PatchCharacterFieldInput,
  callerUid: string
): Promise<void> {
  const patch = normalizePatch(input);
  for (const [field, value] of Object.entries(patch)) {
    assertValidCharacterFieldValue(field, value);
  }

  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  const dmId = campaignSnapshot.data()?.dmId;

  await db.runTransaction(
    async (transaction) => {
      const characterSnapshot = await transaction.get(characterRef);
      if (!characterSnapshot.exists) {
        throw new HttpsError("not-found", "Character not found.");
      }
      const characterData = characterSnapshot.data() ?? {};
      await assertCanEditCharacter(db, callerUid, dmId, characterData);
      transaction.update(characterRef, patch);
      if (Object.keys(patch).some(isSummaryRelevantField)) {
        const merged = { ...characterData, ...patch };
        const summaryRef = campaignRef.collection("characterSummaries").doc(input.characterId);
        transaction.set(summaryRef, computeCharacterSummary(merged));
      }
    },
    { maxAttempts: 5 }
  );
}
