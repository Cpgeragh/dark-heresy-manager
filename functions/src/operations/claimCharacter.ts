// functions/src/operations/claimCharacter.ts
//
// Stage 3.3: replaces the current insecure direct claim (which only needs
// a campaignId/characterId, no Recovery Code proof at all — the exact gap
// named in Stage 1's findings). The client only ever supplies the code;
// the server resolves which character that actually is, so claiming is
// only possible by someone who genuinely has the code. Both the existence
// and ownership checks happen inside the transaction, not as a pre-read,
// so a genuine race between two claim attempts — or a character deleted
// mid-flight — fails cleanly instead of silently overwriting.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import { rotateRecoveryCodeInTransaction } from "../shared/recoveryCodeRotation.js";
import { buildClaimLogPayload } from "../shared/claimLog.js";

const RECOVERY_INDEX_COLLECTION = "recoveryIndex";
const CODE_FORMAT = /^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/;

export interface ClaimCharacterInput {
  code: string;
}

export interface ClaimCharacterResult {
  campaignId: string;
  characterId: string;
}

export async function claimCharacter(
  input: ClaimCharacterInput,
  callerUid: string,
  hmacSecret: string
): Promise<ClaimCharacterResult> {
  if (!CODE_FORMAT.test(input.code)) {
    throw new HttpsError("not-found", "Recovery Code not found.");
  }

  const db = getFirestore();
  const hash = hashRecoveryCode(input.code, hmacSecret);
  const indexSnapshot = await db.collection(RECOVERY_INDEX_COLLECTION).doc(hash).get();
  if (!indexSnapshot.exists) {
    throw new HttpsError("not-found", "Recovery Code not found.");
  }

  const { campaignId, characterId } = indexSnapshot.data() as {
    campaignId: string;
    characterId: string;
  };

  const campaignRef = db.collection("campaigns").doc(campaignId);
  const characterRef = campaignRef.collection("characters").doc(characterId);
  const [campaignSnapshot, characterSnapshot] = await Promise.all([
    campaignRef.get(),
    characterRef.get(),
  ]);

  if (!campaignSnapshot.exists || !characterSnapshot.exists) {
    throw new HttpsError("not-found", "Recovery Code not found.");
  }

  await db.runTransaction(async (transaction) => {
    const freshCharacterSnapshot = await transaction.get(characterRef);
    if (!freshCharacterSnapshot.exists) {
      throw new HttpsError("not-found", "Recovery Code not found.");
    }
    if (freshCharacterSnapshot.data()?.userId) {
      throw new HttpsError("failed-precondition", "This character has already been claimed.");
    }

    transaction.update(characterRef, { userId: callerUid });
    transaction.update(campaignRef, { memberIds: FieldValue.arrayUnion(callerUid) });
    transaction.set(
      characterRef.collection("claimLog").doc(),
      buildClaimLogPayload("claim", callerUid, null, callerUid)
    );
    rotateRecoveryCodeInTransaction(
      transaction,
      db,
      characterRef,
      campaignId,
      characterId,
      input.code,
      hmacSecret
    );
  }, { maxAttempts: 5 });

  return { campaignId, characterId };
}
