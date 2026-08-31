// functions/src/shared/recoveryCodeRotation.ts
//
// The recovery-index rotation writes, factored out of
// registerRecoveryCode so claimCharacter can reuse them inside its own
// transaction. Takes an already-open transaction rather than owning one,
// since each caller has its own permission check and its own additional
// writes (ownership, membership, claim log) that need to happen atomically
// alongside the rotation, not as a separate operation.

import type { Firestore, Transaction, DocumentReference } from "firebase-admin/firestore";
import { generateRecoveryCode, hashRecoveryCode } from "./recoveryCode.js";
import { RECOVERY_CODE_HISTORY_COLLECTION, buildRecoveryCodeHistoryPayload } from "./recoveryCodeHistory.js";

const RECOVERY_INDEX_COLLECTION = "recoveryIndex";

export function rotateRecoveryCodeInTransaction(
  transaction: Transaction,
  db: Firestore,
  characterRef: DocumentReference,
  campaignId: string,
  characterId: string,
  previousCode: string | undefined,
  hmacSecret: string,
  additionalCharacterUpdates: Record<string, unknown> = {}
): string {
  const newCode = generateRecoveryCode();
  const newHash = hashRecoveryCode(newCode, hmacSecret);

  if (previousCode) {
    const previousHash = hashRecoveryCode(previousCode, hmacSecret);
    transaction.delete(db.collection(RECOVERY_INDEX_COLLECTION).doc(previousHash));
    transaction.set(
      characterRef.collection(RECOVERY_CODE_HISTORY_COLLECTION).doc(),
      buildRecoveryCodeHistoryPayload("rotated")
    );
  }
  transaction.set(db.collection(RECOVERY_INDEX_COLLECTION).doc(newHash), {
    campaignId,
    characterId,
  });
  transaction.update(characterRef, {
    ...additionalCharacterUpdates,
    recoveryCode: newCode,
  });

  return newCode;
}
