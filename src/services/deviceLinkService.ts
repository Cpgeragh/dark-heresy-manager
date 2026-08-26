import { deleteDoc, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";

const callLinkDevice = httpsCallable<{ code: string }, void>(functions, "linkDevice");

/**
 * Links a secondary device to the account identified by a recovery code,
 * via the linkDevice Function.
 */
export async function linkDeviceToAccount(currentUid: string, recoveryCode: string): Promise<void> {
  assertFirestoreDocumentId(currentUid, "Current user ID");
  assertRecoveryCode(recoveryCode);
  const code = recoveryCode.trim();
  await runSingleFlight("device:link", [currentUid, code], async () => {
    await callLinkDevice({ code });
  });
}

/** Removes the current device's link to its primary account. */
export async function unlinkDevice(uid: string): Promise<void> {
  assertFirestoreDocumentId(uid, "User ID");
  await runSingleFlight("device:unlink", [uid], () => deleteDoc(doc(db, "userLinks", uid)));
}
