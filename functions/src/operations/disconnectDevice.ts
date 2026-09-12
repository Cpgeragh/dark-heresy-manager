import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export interface DisconnectDeviceInput {
  confirmLastDevice?: boolean;
}

export interface DisconnectDeviceResult {
  wasLastDevice: boolean;
}

/** Atomically counts and disconnects this device from its account. */
export async function disconnectDevice(
  input: DisconnectDeviceInput,
  callerUid: string
): Promise<DisconnectDeviceResult> {
  if (input.confirmLastDevice !== undefined && typeof input.confirmLastDevice !== "boolean") {
    throw new HttpsError("invalid-argument", "confirmLastDevice must be a boolean.");
  }
  const db = getFirestore();
  const linkRef = db.collection("userLinks").doc(callerUid);
  const userRef = db.collection("users").doc(callerUid);

  return db.runTransaction(async (transaction) => {
    const linkSnapshot = await transaction.get(linkRef);
    const accountId = linkSnapshot.data()?.primaryUid;
    if (!linkSnapshot.exists || typeof accountId !== "string" || accountId.length === 0) {
      throw new HttpsError("failed-precondition", "This device is not connected to an account.");
    }

    const linksQuery = db.collection("userLinks").where("primaryUid", "==", accountId).limit(2);
    const linksSnapshot = await transaction.get(linksQuery);
    const wasLastDevice = linksSnapshot.size === 1;
    if (wasLastDevice && input.confirmLastDevice !== true) {
      throw new HttpsError("failed-precondition", "This is the last connected device.", {
        reason: "last-device",
      });
    }

    transaction.delete(linkRef);
    transaction.set(userRef, { onboarded: false, recoveryBackedUp: false }, { merge: true });
    return { wasLastDevice };
  });
}
