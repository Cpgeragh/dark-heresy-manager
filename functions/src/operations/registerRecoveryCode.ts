// functions/src/operations/registerRecoveryCode.ts
//
// Stage 3.2a: (re)generates a character's Recovery Code and registers its
// HMAC-derived lookup entry. The raw code is never chosen by the client —
// only this operation mints one, which is what makes the derived lookup ID
// real protection rather than a hash of something the client controls.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { generateRecoveryCode, hashRecoveryCode } from "../shared/recoveryCode.js";

const RECOVERY_INDEX_COLLECTION = "recoveryIndex";

export interface RegisterRecoveryCodeInput {
  campaignId: string;
  characterId: string;
}

export async function registerRecoveryCode(
  input: RegisterRecoveryCodeInput,
  callerUid: string,
  hmacSecret: string
): Promise<{ code: string }> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (campaignSnapshot.data()?.dmId !== callerUid) {
    throw new HttpsError("permission-denied", "Only the campaign DM can generate a Recovery Code.");
  }

  const characterSnapshot = await characterRef.get();
  if (!characterSnapshot.exists) {
    throw new HttpsError("not-found", "Character not found.");
  }

  const previousCode = characterSnapshot.data()?.recoveryCode as string | undefined;
  const newCode = generateRecoveryCode();
  const newHash = hashRecoveryCode(newCode, hmacSecret);

  await db.runTransaction(async (transaction) => {
    if (previousCode) {
      const previousHash = hashRecoveryCode(previousCode, hmacSecret);
      transaction.delete(db.collection(RECOVERY_INDEX_COLLECTION).doc(previousHash));
    }
    transaction.set(db.collection(RECOVERY_INDEX_COLLECTION).doc(newHash), {
      campaignId: input.campaignId,
      characterId: input.characterId,
    });
    transaction.update(characterRef, { recoveryCode: newCode });
  });

  return { code: newCode };
}
