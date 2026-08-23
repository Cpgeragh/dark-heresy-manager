import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";

/**
 * Links a secondary device to the account identified by a recovery code.
 * The temporary proof document is always removed after the link write.
 */
export async function linkDeviceToAccount(currentUid: string, recoveryCode: string): Promise<void> {
  assertFirestoreDocumentId(currentUid, "Current user ID");
  assertRecoveryCode(recoveryCode);
  const code = recoveryCode.trim();
  await runSingleFlight("device:link", [currentUid, code], async () => {
    const recoverySnapshot = await getDoc(doc(db, "identityRecovery", code));
    if (!recoverySnapshot.exists()) {
      throw new Error("No account found with that recovery code.");
    }

    const primaryUid = recoverySnapshot.data().uid as unknown;
    assertFirestoreDocumentId(primaryUid, "Primary user ID");
    if (primaryUid === currentUid) {
      throw new Error("This recovery code belongs to this device.");
    }

    const proofRef = doc(db, "linkProofs", currentUid);
    await setDoc(proofRef, { primaryUid, code });

    try {
      await setDoc(doc(db, "userLinks", currentUid), {
        primaryUid,
        linkedAt: serverTimestamp(),
      });
    } finally {
      await deleteDoc(proofRef);
    }
  });
}

/** Removes the current device's link to its primary account. */
export async function unlinkDevice(uid: string): Promise<void> {
  assertFirestoreDocumentId(uid, "User ID");
  await deleteDoc(doc(db, "userLinks", uid));
}
