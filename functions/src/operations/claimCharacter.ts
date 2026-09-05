// functions/src/operations/claimCharacter.ts
//
// Server-side character claim, replacing a direct client write that only
// needed a campaignId/characterId, no Recovery Code proof at all. The
// client only ever supplies the code;
// the server resolves which character that actually is, so claiming is
// only possible by someone who genuinely has the code. Both the existence
// and ownership checks happen inside the transaction, not as a pre-read,
// so a genuine race between two claim attempts — or a character deleted
// mid-flight — fails cleanly instead of silently overwriting.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import { buildClaimLogPayload } from "../shared/claimLog.js";
import { rotateRecoveryCodeInTransaction } from "../shared/recoveryCodeRotation.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";

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
  hmacSecret: string,
  idempotency: IdempotencyExecution<ClaimCharacterResult> | null = null
): Promise<ClaimCharacterResult> {
  if (!CODE_FORMAT.test(input.code)) {
    throw new HttpsError("not-found", "Recovery Code not found.");
  }

  const db = getFirestore();
  const hash = hashRecoveryCode(input.code, hmacSecret);
  const indexRef = db.collection(RECOVERY_INDEX_COLLECTION).doc(hash);

  return runOperationTransaction(
    db,
    idempotency,
    async (transaction) => {
      const indexSnapshot = await transaction.get(indexRef);
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
        transaction.get(campaignRef),
        transaction.get(characterRef),
      ]);

      if (!campaignSnapshot.exists || !characterSnapshot.exists) {
        throw new HttpsError("not-found", "Recovery Code not found.");
      }

      const character = characterSnapshot.data();
      if (character?.recoveryCode !== input.code) {
        throw new HttpsError("not-found", "Recovery Code not found.");
      }
      if (character.userId) {
        throw new HttpsError("failed-precondition", "This character has already been claimed.");
      }

      rotateRecoveryCodeInTransaction(
        transaction,
        db,
        characterRef,
        campaignId,
        characterId,
        input.code,
        hmacSecret,
        { userId: callerUid }
      );
      transaction.update(campaignRef, { memberIds: FieldValue.arrayUnion(callerUid) });
      transaction.set(
        characterRef.collection("claimLog").doc(),
        buildClaimLogPayload("claim", callerUid, null, callerUid)
      );

      return { campaignId, characterId };
    },
    { maxAttempts: 5 }
  );
}
