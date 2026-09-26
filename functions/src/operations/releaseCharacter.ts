// functions/src/operations/releaseCharacter.ts
//
// A player releases their own claimed character. Existence and
// ownership are checked inside the transaction, not as a pre-read, same
// race-safety reasoning as claimCharacter.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { applyOwnershipTransition } from "../shared/ownershipTransition.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";

export interface ReleaseCharacterInput {
  campaignId: string;
  characterId: string;
  operationId?: string;
}

export async function releaseCharacter(
  input: ReleaseCharacterInput,
  callerUid: string,
  hmacSecret: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  const db = getFirestore();
  const accountId = await resolvePrimaryUid(db, callerUid);
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  await runOperationTransaction(
    db,
    idempotency,
    async (transaction) => {
      const characterSnapshot = await transaction.get(characterRef);
      if (!characterSnapshot.exists) {
        throw new HttpsError("not-found", "Character not found.");
      }
      const characterData = characterSnapshot.data() ?? {};
      const currentOwner = characterData.userId as string | null | undefined;
      if (currentOwner !== accountId) {
        throw new HttpsError("permission-denied", "You do not own this character.");
      }
      const header = (characterData.header ?? {}) as Record<string, unknown>;
      const storedPlayerName =
        typeof header.playerName === "string" ? header.playerName.trim() || null : null;

      await applyOwnershipTransition(
        transaction,
        campaignRef,
        characterRef,
        "release",
        callerUid,
        currentOwner,
        null,
        {
          previousRecoveryCode:
            typeof characterData.recoveryCode === "string"
              ? characterData.recoveryCode
              : undefined,
          recoveryCodeHmacSecret: hmacSecret,
          playerName: storedPlayerName,
        }
      );
      // The membership-removal check below queries the characters subcollection,
      // widening this transaction's read set beyond the single document it used
      // to touch, and racing against another ownership-transition on the same
      // character (which runs the same query) increases retry contention.
      // Padding maxAttempts beyond the SDK's own default of 5 accounts for that.
    },
    { maxAttempts: 10 }
  );
}
