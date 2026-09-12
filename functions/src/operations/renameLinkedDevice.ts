import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { validateDeviceName, validateDeviceUid } from "../shared/deviceLinks.js";

export interface RenameLinkedDeviceInput {
  targetDeviceUid: string;
  name: string;
}

/** Renames a device only when it belongs to the caller's account. */
export async function renameLinkedDevice(
  input: RenameLinkedDeviceInput,
  callerUid: string
): Promise<void> {
  const targetDeviceUid = validateDeviceUid(input.targetDeviceUid);
  const name = validateDeviceName(input.name);
  const db = getFirestore();
  const callerRef = db.collection("userLinks").doc(callerUid);
  const targetRef = db.collection("userLinks").doc(targetDeviceUid);

  await db.runTransaction(async (transaction) => {
    const [callerLink, targetLink] = await Promise.all([
      transaction.get(callerRef),
      transaction.get(targetRef),
    ]);
    const callerAccountId = callerLink.data()?.primaryUid;
    const targetAccountId = targetLink.data()?.primaryUid;
    if (
      !callerLink.exists ||
      !targetLink.exists ||
      typeof callerAccountId !== "string" ||
      callerAccountId !== targetAccountId
    ) {
      throw new HttpsError("permission-denied", "That device is not connected to your account.");
    }
    transaction.update(targetRef, { name });
  });
}
