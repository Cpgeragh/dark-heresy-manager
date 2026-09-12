import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";
import { recordClientCodeAttempt } from "../utils/clientCodeAttemptLimit";

const callLinkDevice = httpsCallable<{ code: string }, void>(functions, "linkDevice");
const callDisconnectDevice = httpsCallable<
  { confirmLastDevice: boolean },
  { wasLastDevice: boolean }
>(functions, "disconnectDevice");

export class LastDeviceDisconnectError extends Error {
  constructor() {
    super("This is the last connected device.");
    this.name = "LastDeviceDisconnectError";
  }
}

/**
 * Connects this device to the account identified by a recovery code,
 * via the linkDevice Function.
 */
export async function linkDeviceToAccount(currentUid: string, recoveryCode: string): Promise<void> {
  assertFirestoreDocumentId(currentUid, "Current user ID");
  assertRecoveryCode(recoveryCode);
  const code = recoveryCode.trim();
  await runSingleFlight("device:link", [currentUid, code], async () => {
    recordClientCodeAttempt("device-link");
    await callLinkDevice({ code });
  });
}

/** Disconnects only the current device. The account and its data remain. */
export async function disconnectDevice(
  uid: string,
  confirmLastDevice = false
): Promise<{ wasLastDevice: boolean }> {
  assertFirestoreDocumentId(uid, "User ID");
  return runSingleFlight("device:disconnect", [uid, confirmLastDevice], async () => {
    try {
      const { data } = await callDisconnectDevice({ confirmLastDevice });
      return data;
    } catch (error) {
      const details = (error as { details?: { reason?: unknown } } | null)?.details;
      if (details?.reason === "last-device") throw new LastDeviceDisconnectError();
      throw error;
    }
  });
}
