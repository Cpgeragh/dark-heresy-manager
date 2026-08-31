// functions/src/operations/registerRecoveryCode.ts
//
// Stage 3.2a: (re)generates a character's Recovery Code and registers its
// HMAC-derived lookup entry. The raw code is never chosen by the client —
// only this operation mints one, which is what makes the derived lookup ID
// real protection rather than a hash of something the client controls. The
// character is read inside the transaction, not as a pre-read, so two
// racing regenerate calls can't leave an orphaned, still-valid index entry.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { rotateRecoveryCodeInTransaction } from "../shared/recoveryCodeRotation.js";

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
  if (!(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))) {
    throw new HttpsError("permission-denied", "Only the campaign DM can generate a Recovery Code.");
  }

  let newCode = "";

  await db.runTransaction(async (transaction) => {
    const characterSnapshot = await transaction.get(characterRef);
    if (!characterSnapshot.exists) {
      throw new HttpsError("not-found", "Character not found.");
    }

    const previousCode = characterSnapshot.data()?.recoveryCode as string | undefined;
    newCode = rotateRecoveryCodeInTransaction(
      transaction,
      db,
      characterRef,
      input.campaignId,
      input.characterId,
      previousCode,
      hmacSecret
    );
  }, { maxAttempts: 5 });

  return { code: newCode };
}
