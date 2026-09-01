// src/services/identityService.ts
// Generates and stores a user's identity recovery record.
// One record per user — covers all their campaigns and characters.

import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";
import { driveJobToCompletion } from "../utils/bulkJobClient";
import { recordClientCodeAttempt } from "../utils/clientCodeAttemptLimit";

const callRegisterIdentityCode = httpsCallable<
  { role: "dm" | "player"; targetUid?: string },
  { code: string }
>(functions, "registerIdentityCode");

const callStartIdentityReclaimJob = httpsCallable<
  { code: string },
  {
    jobId: string;
    totalCount: number;
    role: "dm" | "player";
    profileTransferred: boolean;
  }
>(functions, "startIdentityReclaimJob");

const callProcessIdentityReclaimChunk = httpsCallable<
  { jobId: string },
  { done: boolean; processedCount: number; totalCount: number }
>(functions, "processIdentityReclaimChunk");

const callRevokeIdentityCode = httpsCallable<Record<string, never>, void>(
  functions,
  "revokeIdentityCode"
);

const callGetIdentityRecoveryMode = httpsCallable<
  { code: string },
  | { status: "found"; mode: "link" | "reclaim" }
  | { status: "not-found" }
  | { status: "own-code" }
  | { status: "missing-data" }
>(functions, "getIdentityRecoveryMode");

export async function getIdentityRecoveryMode(code: string): Promise<"link" | "reclaim"> {
  assertRecoveryCode(code);
  const normalisedCode = code.trim();
  return runSingleFlight("identity:recovery-mode", [normalisedCode], async () => {
    recordClientCodeAttempt("recovery");
    const { data } = await callGetIdentityRecoveryMode({ code: normalisedCode });
    if (data.status === "not-found") {
      throw new Error("Recovery code not found.");
    }
    if (data.status === "own-code") {
      throw new Error("This code belongs to this device.");
    }
    if (data.status === "missing-data") {
      throw new Error("Recovery identity is invalid.");
    }
    return data.mode;
  });
}

/**
 * Reclaims an identity on a new device using a previously issued recovery
 * code, via the resumable startIdentityReclaimJob/processIdentityReclaimChunk
 * Functions. The identity documents transfer immediately when the job
 * starts; every campaign/character the old identity owned then migrates in
 * chunks, resumable if a call drops mid-way. onProgress, if given, is
 * called after the job starts and after each chunk with the running
 * processed/total counts.
 * Returns the reclaimed role so the caller can update local app state.
 */
export interface ReclaimIdentityResult {
  role: "dm" | "player";
  profileTransferred: boolean;
}

export async function reclaimIdentity(
  code: string,
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void
): Promise<ReclaimIdentityResult> {
  assertRecoveryCode(code);
  const normalisedCode = code.trim();
  return runSingleFlight("identity:reclaim", [normalisedCode], async () => {
    recordClientCodeAttempt("recovery");
    const { data: started } = await callStartIdentityReclaimJob({ code: normalisedCode });
    onProgress?.({ processedCount: 0, totalCount: started.totalCount });
    await driveJobToCompletion(
      started.jobId,
      async (jobId) => (await callProcessIdentityReclaimChunk({ jobId })).data,
      (chunk) => onProgress?.({ processedCount: chunk.processedCount, totalCount: chunk.totalCount })
    );
    return {
      role: started.role,
      profileTransferred: started.profileTransferred,
    };
  });
}

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
 * Rotates (or first-generates) the identity recovery code for uid, via the
 * registerIdentityCode Function. uid may be the caller's own account, or —
 * from a linked secondary device — the primary account it's linked to; the
 * Function verifies that server-side, mirroring firestore.rules'
 * playerOwnsOrLinked.
 * Returns the new code so the UI can display it.
 */
export async function rotateRecoveryCode(
  uid: string,
  role: "dm" | "player" = "player"
): Promise<string> {
  assertFirestoreDocumentId(uid, "User ID");
  if (role !== "dm" && role !== "player") throw new Error("Recovery role is invalid.");
  return runSingleFlight("identity:rotate-recovery", [uid, role], async () => {
    const { data } = await callRegisterIdentityCode({ role, targetUid: uid });
    return data.code;
  });
}

/** Revokes the current account-level recovery code without replacing it. */
export async function revokeIdentityRecoveryCode(): Promise<void> {
  await runSingleFlight("identity:revoke-recovery", [], async () => {
    await callRevokeIdentityCode({});
  });
}
