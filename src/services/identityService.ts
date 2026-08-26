// src/services/identityService.ts
// Generates and stores a user's identity recovery record.
// One record per user — covers all their campaigns and characters.

import { doc, writeBatch, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";
import { driveJobToCompletion } from "../utils/bulkJobClient";

const callRegisterIdentityCode = httpsCallable<
  { role: "dm" | "player"; targetUid?: string },
  { code: string }
>(functions, "registerIdentityCode");

const callStartIdentityReclaimJob = httpsCallable<
  { code: string },
  { jobId: string; totalCount: number; role: "dm" | "player" }
>(functions, "startIdentityReclaimJob");

const callProcessIdentityReclaimChunk = httpsCallable<
  { jobId: string },
  { done: boolean; processedCount: number; totalCount: number }
>(functions, "processIdentityReclaimChunk");

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
export async function reclaimIdentity(
  code: string,
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void
): Promise<"dm" | "player"> {
  assertRecoveryCode(code);
  const normalisedCode = code.trim();
  return runSingleFlight("identity:reclaim", [normalisedCode], async () => {
    const { data: started } = await callStartIdentityReclaimJob({ code: normalisedCode });
    onProgress?.({ processedCount: 0, totalCount: started.totalCount });
    await driveJobToCompletion(
      started.jobId,
      async (jobId) => (await callProcessIdentityReclaimChunk({ jobId })).data,
      (chunk) => onProgress?.({ processedCount: chunk.processedCount, totalCount: chunk.totalCount })
    );
    return started.role;
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

/**
 * Removes both identity recovery documents for a user.
 * Called when a user explicitly opts out of recovery, or before re-registering.
 */
export async function clearIdentityRecovery(uid: string, code: string): Promise<void> {
  assertFirestoreDocumentId(uid, "User ID");
  assertRecoveryCode(code);
  const batch = writeBatch(db);
  batch.delete(doc(db, "identityRecovery", code.trim()));
  batch.delete(doc(db, "identitySecret", uid));
  await batch.commit();
}
