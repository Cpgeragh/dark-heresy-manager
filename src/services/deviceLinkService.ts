import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";
import { recordClientCodeAttempt } from "../utils/clientCodeAttemptLimit";
import { PRODUCT_LIMITS } from "../constants/productLimits";

export interface LinkedDevice {
  uid: string;
  name: string | null;
  linkedAt: number | null;
  isCurrentDevice: boolean;
}

const callLinkDevice = httpsCallable<{ code: string; deviceName: string }, void>(
  functions,
  "linkDevice"
);
const callDisconnectDevice = httpsCallable<
  { confirmLastDevice: boolean },
  { wasLastDevice: boolean }
>(functions, "disconnectDevice");
const callListLinkedDevices = httpsCallable<Record<string, never>, { devices: LinkedDevice[] }>(
  functions,
  "listLinkedDevices"
);
const callRenameLinkedDevice = httpsCallable<{ targetDeviceUid: string; name: string }, void>(
  functions,
  "renameLinkedDevice"
);
const callDisconnectOtherDevice = httpsCallable<
  { targetDeviceUid: string },
  { recoveryCode: string; remainingDeviceCount: number }
>(functions, "disconnectOtherDevice");

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
export async function linkDeviceToAccount(
  currentUid: string,
  recoveryCode: string,
  deviceName: string
): Promise<void> {
  assertFirestoreDocumentId(currentUid, "Current user ID");
  assertRecoveryCode(recoveryCode);
  const code = recoveryCode.trim();
  const name = validateDeviceName(deviceName);
  await runSingleFlight("device:link", [currentUid, code, name], async () => {
    recordClientCodeAttempt("device-link");
    await callLinkDevice({ code, deviceName: name });
  });
}

function validateDeviceName(value: string): string {
  const name = value.trim();
  if (!name || name.length > PRODUCT_LIMITS.deviceNameCharacters) {
    throw new Error(
      `Device name must be between 1 and ${PRODUCT_LIMITS.deviceNameCharacters} characters.`
    );
  }
  return name;
}

/** Lists every device connected to the signed-in account. */
export async function listLinkedDevices(): Promise<LinkedDevice[]> {
  const { data } = await callListLinkedDevices({});
  return data.devices;
}

/** Renames any device that belongs to the signed-in account. */
export async function renameLinkedDevice(
  targetDeviceUid: string,
  deviceName: string
): Promise<void> {
  assertFirestoreDocumentId(targetDeviceUid, "Device ID");
  const name = validateDeviceName(deviceName);
  await runSingleFlight("device:rename", [targetDeviceUid, name], async () => {
    await callRenameLinkedDevice({ targetDeviceUid, name });
  });
}

/** Disconnects another device and returns the automatically rotated recovery code. */
export async function disconnectOtherDevice(
  targetDeviceUid: string
): Promise<{ recoveryCode: string; remainingDeviceCount: number }> {
  assertFirestoreDocumentId(targetDeviceUid, "Device ID");
  return runSingleFlight("device:disconnect-other", [targetDeviceUid], async () => {
    const { data } = await callDisconnectOtherDevice({ targetDeviceUid });
    assertRecoveryCode(data.recoveryCode);
    return data;
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
