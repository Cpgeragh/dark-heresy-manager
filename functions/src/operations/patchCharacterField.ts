// functions/src/operations/patchCharacterField.ts
//
// Generic dispatcher for narrowly-scoped character field patches — the
// Stage 12 replacement for letting the client write arbitrary character
// fields directly under firestore.rules' shallow validation. Loads the
// document, checks the same DM-or-editable-player authorization the rules
// use today, validates the field's new value with its trusted server-side
// validator, and writes transactionally. Only fields with a registered
// validator in characterFieldValidation.ts can be patched this way; every
// other field stays on its existing direct-write path until its own stage
// migrates it.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCanEditCharacter } from "../shared/characterAuthorization.js";
import { assertValidCharacterFieldValue } from "../shared/characterFieldValidation.js";

export interface PatchCharacterFieldInput {
  campaignId: string;
  characterId: string;
  field: string;
  value: unknown;
  operationId?: string;
}

export async function patchCharacterField(
  input: PatchCharacterFieldInput,
  callerUid: string
): Promise<void> {
  assertValidCharacterFieldValue(input.field, input.value);

  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  const dmId = campaignSnapshot.data()?.dmId;

  await db.runTransaction(async (transaction) => {
    const characterSnapshot = await transaction.get(characterRef);
    if (!characterSnapshot.exists) {
      throw new HttpsError("not-found", "Character not found.");
    }
    await assertCanEditCharacter(db, callerUid, dmId, characterSnapshot.data() ?? {});
    transaction.update(characterRef, { [input.field]: input.value });
  }, { maxAttempts: 5 });
}
