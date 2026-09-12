// src/services/identityService.ts
// Generates and stores a user's identity recovery record.
// One record per user — covers all their campaigns and characters.

import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";

const callRegisterIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
  functions,
  "registerIdentityCode"
);

const callCreateAccount = httpsCallable<Record<string, never>, { accountId: string; code: string }>(
  functions,
  "createAccount"
);

/** Gives this device a brand new account: a fresh id, a link record, and a recovery code. */
export async function createAccount(): Promise<{ accountId: string; code: string }> {
  return runSingleFlight("identity:create-account", [], async () => {
    const { data } = await callCreateAccount({});
    return data;
  });
}

const callRevokeIdentityCode = httpsCallable<Record<string, never>, void>(
  functions,
  "revokeIdentityCode"
);

/**
 * Reads the user's current recovery code from identitySecret.
 * Returns null if no code exists (e.g. user hasn't completed onboarding).
 */
export async function getRecoveryCode(uid: string): Promise<string | null> {
  assertFirestoreDocumentId(uid, "User ID");
  const snap = await getDoc(doc(db, "identitySecret", uid));
  if (!snap.exists()) return null;
  const code = (snap.data() as { code: unknown }).code;
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

/** Revokes the current account-level recovery code without replacing it. */
export async function revokeIdentityRecoveryCode(): Promise<void> {
  await runSingleFlight("identity:revoke-recovery", [], async () => {
    await callRevokeIdentityCode({});
  });
}
