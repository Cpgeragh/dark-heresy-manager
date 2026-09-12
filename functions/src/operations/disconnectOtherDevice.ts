import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { generateRecoveryCode, hashRecoveryCode } from "../shared/recoveryCode.js";
import { validateDeviceUid } from "../shared/deviceLinks.js";

export interface DisconnectOtherDeviceInput {
  targetDeviceUid: string;
}

export interface DisconnectOtherDeviceResult {
  recoveryCode: string;
  remainingDeviceCount: number;
}

/** Disconnects another device and rotates recovery in the same transaction. */
export async function disconnectOtherDevice(
  input: DisconnectOtherDeviceInput,
  callerUid: string,
  hmacSecret: string
): Promise<DisconnectOtherDeviceResult> {
  const targetDeviceUid = validateDeviceUid(input.targetDeviceUid);
  if (targetDeviceUid === callerUid) {
    throw new HttpsError("invalid-argument", "Use Disconnect This Device for the current device.");
  }

  const db = getFirestore();
  const callerRef = db.collection("userLinks").doc(callerUid);
  const targetRef = db.collection("userLinks").doc(targetDeviceUid);
  const targetUserRef = db.collection("users").doc(targetDeviceUid);
  const newCode = generateRecoveryCode();
  const newHash = hashRecoveryCode(newCode, hmacSecret);

  return db.runTransaction(async (transaction) => {
    const [callerLink, targetLink] = await Promise.all([
      transaction.get(callerRef),
      transaction.get(targetRef),
    ]);
    const accountId = callerLink.data()?.primaryUid;
    if (
      !callerLink.exists ||
      !targetLink.exists ||
      typeof accountId !== "string" ||
      targetLink.data()?.primaryUid !== accountId
    ) {
      throw new HttpsError("permission-denied", "That device is not connected to your account.");
    }

    const secretRef = db.collection("identitySecret").doc(accountId);
    const newIndexRef = db.collection("identityRecoveryIndex").doc(newHash);
    const linksQuery = db.collection("userLinks").where("primaryUid", "==", accountId);
    const [secret, newIndex, links] = await Promise.all([
      transaction.get(secretRef),
      transaction.get(newIndexRef),
      transaction.get(linksQuery),
    ]);
    if (links.size < 2) {
      throw new HttpsError(
        "failed-precondition",
        "The final connected device cannot be removed remotely."
      );
    }
    if (newIndex.exists) {
      throw new HttpsError("already-exists", "Please try disconnecting the device again.");
    }

    const previousCode = secret.data()?.code;
    if (typeof previousCode === "string" && previousCode.length > 0) {
      transaction.delete(
        db.collection("identityRecoveryIndex").doc(hashRecoveryCode(previousCode, hmacSecret))
      );
    }
    transaction.set(secretRef, { code: newCode });
    transaction.create(newIndexRef, { uid: accountId });
    transaction.delete(targetRef);
    transaction.set(targetUserRef, { onboarded: false, recoveryBackedUp: false }, { merge: true });

    return { recoveryCode: newCode, remainingDeviceCount: links.size - 1 };
  });
}
