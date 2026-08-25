// functions/src/operations/registerIdentityCode.ts
//
// Stage 5.4c-i: mints and hashes a user's identity recovery code — the
// first server-side registration point for whole-account recovery, mirrors
// registerRecoveryCode.ts's exact HMAC pattern but for identity codes
// rather than a single character. The caller can only ever register their
// own code, there is no target-uid input. identitySecret/{uid}'s plaintext
// display copy is unchanged — that's the owner-readable "reveal your code"
// field, not the security boundary — the hash-derived
// identityRecoveryIndex/{hash} entry is.

import { getFirestore } from "firebase-admin/firestore";
import { generateRecoveryCode, hashRecoveryCode } from "../shared/recoveryCode.js";

const IDENTITY_INDEX_COLLECTION = "identityRecoveryIndex";
const IDENTITY_SECRET_COLLECTION = "identitySecret";

export interface RegisterIdentityCodeInput {
  role: "dm" | "player";
}

export async function registerIdentityCode(
  input: RegisterIdentityCodeInput,
  callerUid: string,
  hmacSecret: string
): Promise<{ code: string }> {
  const db = getFirestore();
  const secretRef = db.collection(IDENTITY_SECRET_COLLECTION).doc(callerUid);

  let newCode = "";

  await db.runTransaction(async (transaction) => {
    const secretSnapshot = await transaction.get(secretRef);
    const previousCode = secretSnapshot.exists
      ? (secretSnapshot.data()?.code as string | undefined)
      : undefined;

    newCode = generateRecoveryCode();
    const newHash = hashRecoveryCode(newCode, hmacSecret);

    if (previousCode) {
      const previousHash = hashRecoveryCode(previousCode, hmacSecret);
      transaction.delete(db.collection(IDENTITY_INDEX_COLLECTION).doc(previousHash));
    }
    transaction.set(db.collection(IDENTITY_INDEX_COLLECTION).doc(newHash), {
      uid: callerUid,
      role: input.role,
    });
    transaction.set(secretRef, { code: newCode });
  }, { maxAttempts: 5 });

  return { code: newCode };
}
