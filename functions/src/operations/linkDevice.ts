// functions/src/operations/linkDevice.ts
//
// Stage 3.3: links a secondary device to a primary account using an
// identity recovery code, same verification as reclaimIdentity but no
// ownership migration, just the link record.

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export interface LinkDeviceInput {
  code: string;
}

export async function linkDevice(input: LinkDeviceInput, callerUid: string): Promise<void> {
  const db = getFirestore();
  const code = input.code.trim();

  const recoverySnapshot = await db.collection("identityRecovery").doc(code).get();
  if (!recoverySnapshot.exists) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const primaryUid = recoverySnapshot.data()?.uid as string;
  if (primaryUid === callerUid) {
    throw new HttpsError("failed-precondition", "This code belongs to this device.");
  }

  const secretSnapshot = await db.collection("identitySecret").doc(primaryUid).get();
  if (!secretSnapshot.exists || secretSnapshot.data()?.code !== code) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  await db.collection("userLinks").doc(callerUid).set({
    primaryUid,
    linkedAt: FieldValue.serverTimestamp(),
  });
}
