// functions/src/operations/linkDevice.ts
//
// Connects a device to a permanent account using an identity recovery
// code. Looks the code up by its HMAC-derived hash in identityRecoveryIndex
// — the same trust boundary claimCharacter relies on for character codes: a
// hash match alone is proof the caller knew the real code.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import { validateDeviceName } from "../shared/deviceLinks.js";

export interface LinkDeviceInput {
  code: string;
  deviceName: string;
}

export async function linkDevice(
  input: LinkDeviceInput,
  callerUid: string,
  hmacSecret: string
): Promise<void> {
  const db = getFirestore();
  const code = input.code.trim();
  const deviceName = validateDeviceName(input.deviceName);
  const hash = hashRecoveryCode(code, hmacSecret);

  const indexRef = db.collection("identityRecoveryIndex").doc(hash);
  const linkRef = db.collection("userLinks").doc(callerUid);
  const userRef = db.collection("users").doc(callerUid);

  await db.runTransaction(async (transaction) => {
    const [indexSnapshot, linkSnapshot, userSnapshot] = await Promise.all([
      transaction.get(indexRef),
      transaction.get(linkRef),
      transaction.get(userRef),
    ]);
    if (!indexSnapshot.exists) {
      throw new HttpsError("not-found", "Recovery code not found.");
    }
    if (linkSnapshot.exists) {
      throw new HttpsError(
        "failed-precondition",
        "This device is already connected to an account."
      );
    }
    if (!userSnapshot.exists || userSnapshot.data()?.onboarded !== false) {
      throw new HttpsError("failed-precondition", "Disconnect this device before connecting it.");
    }

    const accountId = indexSnapshot.data()?.uid;
    if (typeof accountId !== "string" || accountId.length === 0) {
      throw new HttpsError("failed-precondition", "This recovery code is invalid.");
    }

    const accountRef = db.collection("accounts").doc(accountId);
    const profileRef = db.collection("userProfiles").doc(accountId);
    const [accountSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(accountRef),
      transaction.get(profileRef),
    ]);
    if (accountSnapshot.exists && accountSnapshot.data()?.status !== "active") {
      throw new HttpsError("failed-precondition", "This account setup has not been completed.");
    }

    const firstName = profileSnapshot.exists ? profileSnapshot.data()?.firstName : undefined;
    if (
      !profileSnapshot.exists ||
      typeof firstName !== "string" ||
      firstName.length === 0 ||
      firstName.length > 50
    ) {
      throw new HttpsError(
        "failed-precondition",
        "This recovery identity has no valid profile and cannot be connected."
      );
    }

    transaction.create(linkRef, {
      primaryUid: accountId,
      name: deviceName,
      linkedAt: FieldValue.serverTimestamp(),
    });
  });
}
