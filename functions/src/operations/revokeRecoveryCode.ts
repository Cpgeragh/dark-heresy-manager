// functions/src/operations/revokeRecoveryCode.ts
//
// Stage 3: invalidates a character's current Recovery Code without issuing
// a replacement — for when a DM knows a code has leaked and wants it dead
// immediately, decoupled from generating and distributing a new one. An
// empty string represents "no usable code," the same convention
// buildCampaignDeletionPlan/buildCharacterDeletionPlan already use (any
// value failing the DH-XXXX-YYYY format check is already treated as
// unusable there). Deliberately permissive like force-release: revoking an
// already-revoked or code-less character succeeds rather than erroring.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

const RECOVERY_INDEX_COLLECTION = "recoveryIndex";
const CODE_FORMAT = /^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/;

export interface RevokeRecoveryCodeInput {
  campaignId: string;
  characterId: string;
}

export async function revokeRecoveryCode(
  input: RevokeRecoveryCodeInput,
  callerUid: string,
  hmacSecret: string
): Promise<void> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (campaignSnapshot.data()?.dmId !== callerUid) {
    throw new HttpsError("permission-denied", "Only the campaign DM can revoke a Recovery Code.");
  }

  await db.runTransaction(async (transaction) => {
    const characterSnapshot = await transaction.get(characterRef);
    if (!characterSnapshot.exists) {
      throw new HttpsError("not-found", "Character not found.");
    }

    const currentCode = characterSnapshot.data()?.recoveryCode as string | undefined;
    if (currentCode && CODE_FORMAT.test(currentCode)) {
      const hash = hashRecoveryCode(currentCode, hmacSecret);
      transaction.delete(db.collection(RECOVERY_INDEX_COLLECTION).doc(hash));
    }
    transaction.update(characterRef, { recoveryCode: "" });
  }, { maxAttempts: 5 });
}
