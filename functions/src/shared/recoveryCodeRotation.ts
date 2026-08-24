// functions/src/shared/recoveryCodeRotation.ts
//
// Stage 3.3: the recovery-index rotation writes, factored out of
// registerRecoveryCode so claimCharacter can reuse them inside its own
// transaction. Takes an already-open transaction rather than owning one,
// since each caller has its own permission check and its own additional
// writes (ownership, membership, claim log) that need to happen atomically
// alongside the rotation, not as a separate operation.

import type { Firestore, Transaction, DocumentReference } from "firebase-admin/firestore";
import { generateRecoveryCode, hashRecoveryCode } from "./recoveryCode.js";

const RECOVERY_INDEX_COLLECTION = "recoveryIndex";

export function rotateRecoveryCodeInTransaction(
  transaction: Transaction,
  db: Firestore,
  characterRef: DocumentReference,
  campaignId: string,
  characterId: string,
  previousCode: string | undefined,
  hmacSecret: string
): string {
  const newCode = generateRecoveryCode();
  const newHash = hashRecoveryCode(newCode, hmacSecret);

  if (previousCode) {
    const previousHash = hashRecoveryCode(previousCode, hmacSecret);
    transaction.delete(db.collection(RECOVERY_INDEX_COLLECTION).doc(previousHash));
  }
  transaction.set(db.collection(RECOVERY_INDEX_COLLECTION).doc(newHash), {
    campaignId,
    characterId,
  });
  transaction.update(characterRef, { recoveryCode: newCode });

  return newCode;
}
