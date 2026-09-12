// functions/src/operations/registerIdentityCode.ts
//
// Mints and hashes a user's identity recovery code — the
// first server-side registration point for whole-account recovery, mirrors
// registerRecoveryCode.ts's exact HMAC pattern but for identity codes
// rather than a single character. identitySecret/{uid}'s plaintext display
// copy is unchanged — that's the owner-readable "reveal your code" field,
// not the security boundary — the hash-derived identityRecoveryIndex/{hash}
// entry is.
//
// The caller's device link is resolved server-side, so clients cannot choose
// which account receives the new code.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { generateRecoveryCode, hashRecoveryCode } from "../shared/recoveryCode.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";

const IDENTITY_INDEX_COLLECTION = "identityRecoveryIndex";
const IDENTITY_SECRET_COLLECTION = "identitySecret";
const USER_PROFILES_COLLECTION = "userProfiles";

export async function registerIdentityCode(
  callerUid: string,
  hmacSecret: string
): Promise<{ code: string }> {
  const db = getFirestore();
  const identityUid = await resolvePrimaryUid(db, callerUid);

  const secretRef = db.collection(IDENTITY_SECRET_COLLECTION).doc(identityUid);
  const profileRef = db.collection(USER_PROFILES_COLLECTION).doc(identityUid);

  let newCode = "";

  await db.runTransaction(
    async (transaction) => {
      const secretSnapshot = await transaction.get(secretRef);
      const profileSnapshot = await transaction.get(profileRef);
      const firstName = profileSnapshot.exists ? profileSnapshot.data()?.firstName : undefined;
      if (
        !profileSnapshot.exists ||
        typeof firstName !== "string" ||
        firstName.length === 0 ||
        firstName.length > 50
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Save a valid first name before creating an identity recovery code."
        );
      }
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
        uid: identityUid,
      });
      transaction.set(secretRef, { code: newCode });
    },
    { maxAttempts: 5 }
  );

  return { code: newCode };
}
