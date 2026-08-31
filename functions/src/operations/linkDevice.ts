// functions/src/operations/linkDevice.ts
//
// Stage 3.3, updated in Stage 5.4c-i: links a secondary device to a primary
// account using an identity recovery code. Looks the code up by its
// HMAC-derived hash in identityRecoveryIndex — the same trust boundary
// claimCharacter already relies on for character codes, a hash match alone
// is proof the caller knew the real code, so the old second identitySecret
// plaintext cross-check is no longer needed and has been removed.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

export interface LinkDeviceInput {
  code: string;
}

export async function linkDevice(
  input: LinkDeviceInput,
  callerUid: string,
  hmacSecret: string
): Promise<void> {
  const db = getFirestore();
  const code = input.code.trim();
  const hash = hashRecoveryCode(code, hmacSecret);

  const indexSnapshot = await db.collection("identityRecoveryIndex").doc(hash).get();
  if (!indexSnapshot.exists) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const primaryUid = indexSnapshot.data()?.uid as string;
  if (primaryUid === callerUid) {
    throw new HttpsError("failed-precondition", "This code belongs to this device.");
  }

  const profileSnapshot = await db.collection("userProfiles").doc(primaryUid).get();
  const firstName = profileSnapshot.exists ? profileSnapshot.data()?.firstName : undefined;
  if (
    !profileSnapshot.exists ||
    typeof firstName !== "string" ||
    firstName.length === 0 ||
    firstName.length > 50
  ) {
    throw new HttpsError(
      "failed-precondition",
      "This recovery identity has no valid profile and cannot be linked."
    );
  }

  await db.collection("userLinks").doc(callerUid).set({
    primaryUid,
    linkedAt: FieldValue.serverTimestamp(),
  });
}
