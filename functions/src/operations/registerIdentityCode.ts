// functions/src/operations/registerIdentityCode.ts
//
// Stage 5.4c-i: mints and hashes a user's identity recovery code — the
// first server-side registration point for whole-account recovery, mirrors
// registerRecoveryCode.ts's exact HMAC pattern but for identity codes
// rather than a single character. identitySecret/{uid}'s plaintext display
// copy is unchanged — that's the owner-readable "reveal your code" field,
// not the security boundary — the hash-derived identityRecoveryIndex/{hash}
// entry is.
//
// Stage 5.4c-ii: targetUid lets a linked secondary device act for the
// primary account it's linked to, mirroring firestore.rules'
// playerOwnsOrLinked exactly — this Function grants no more access than the
// rules already allow for revealing/rotating the primary's identity code.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { generateRecoveryCode, hashRecoveryCode } from "../shared/recoveryCode.js";

const IDENTITY_INDEX_COLLECTION = "identityRecoveryIndex";
const IDENTITY_SECRET_COLLECTION = "identitySecret";
const USER_LINKS_COLLECTION = "userLinks";

export interface RegisterIdentityCodeInput {
  role: "dm" | "player";
  targetUid?: string;
}

export async function registerIdentityCode(
  input: RegisterIdentityCodeInput,
  callerUid: string,
  hmacSecret: string
): Promise<{ code: string }> {
  const db = getFirestore();

  let identityUid = callerUid;
  if (input.targetUid && input.targetUid !== callerUid) {
    const linkSnapshot = await db.collection(USER_LINKS_COLLECTION).doc(callerUid).get();
    if (!linkSnapshot.exists || linkSnapshot.data()?.primaryUid !== input.targetUid) {
      throw new HttpsError(
        "permission-denied",
        "This device is not linked to the requested account."
      );
    }
    identityUid = input.targetUid;
  }

  const secretRef = db.collection(IDENTITY_SECRET_COLLECTION).doc(identityUid);

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
      uid: identityUid,
      role: input.role,
    });
    transaction.set(secretRef, { code: newCode });
  }, { maxAttempts: 5 });

  return { code: newCode };
}
