import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  readDeviceCount,
  writeDeviceCount,
  persistRecountOnRejection,
} from "../shared/deviceCount.js";

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

    const accountRef = db.collection("accounts").doc(accountId);
    const accountSnapshot = await transaction.get(accountRef);
    const { count: deviceCount, wasRecounted } = await readDeviceCount(
      db,
      transaction,
      accountId,
      accountSnapshot
    );
    const wasLastDevice = deviceCount === 1;
    if (wasLastDevice && input.confirmLastDevice !== true) {
      if (wasRecounted) persistRecountOnRejection(db, accountId, deviceCount);
      throw new HttpsError("failed-precondition", "This is the last connected device.", {
        reason: "last-device",
      });
    }

    transaction.delete(linkRef);
    writeDeviceCount(transaction, accountRef, Math.max(0, deviceCount - 1));
    transaction.set(userRef, { onboarded: false, recoveryBackedUp: false }, { merge: true });
    return { wasLastDevice };
  });
}
