// src/services/identityService.ts
// Generates and stores a user's identity recovery record.
// One record per user — covers all their campaigns and characters.

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";

const callRegisterIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
  functions,
  "registerIdentityCode"
);
const callRevealIdentityCode = httpsCallable<Record<string, never>, { code: string | null }>(
  functions,
  "revealIdentityCode"
);

const callCreateAccount = httpsCallable<
  { deviceName: string },
  { accountId: string; code: string }
>(functions, "createAccount");

/** Gives this device a brand new account: a fresh id, a link record, and a recovery code. */
export async function createAccount(
  deviceName: string
): Promise<{ accountId: string; code: string }> {
  const name = deviceName.trim();
  if (!name) throw new Error("Device name is required.");
  return runSingleFlight("identity:create-account", [name], async () => {
    const { data } = await callCreateAccount({ deviceName: name });
    return data;
  });
}

/**
 * Reveals the signed-in device's current recovery code through the server.
 * Returns null if no code exists (e.g. user hasn't completed onboarding).
 */
export async function getRecoveryCode(uid: string): Promise<string | null> {
  assertFirestoreDocumentId(uid, "User ID");
  const { data } = await callRevealIdentityCode({});
  const code = data.code;
  if (code === null) return null;
  assertRecoveryCode(code);
  return code.trim();
}

/**
 * Rotates (or first-generates) the identity recovery code for the permanent
 * account id. The Function verifies the device connection server-side, mirroring firestore.rules'
 * playerOwnsOrLinked.
 * Returns the new code so the UI can display it.
 */
export async function rotateRecoveryCode(
  uid: string,
  _role: "dm" | "player" = "player"
): Promise<string> {
  assertFirestoreDocumentId(uid, "User ID");
  if (_role !== "dm" && _role !== "player") throw new Error("Recovery role is invalid.");
  return runSingleFlight("identity:rotate-recovery", [uid], async () => {
    const { data } = await callRegisterIdentityCode({});
    return data.code;
  });
}
