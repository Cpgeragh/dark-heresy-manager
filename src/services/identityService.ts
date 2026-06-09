// src/services/identityService.ts
// Generates and stores a user's identity recovery record.
// One record per user — covers all their campaigns and characters.

import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { generateRecoveryCode } from "../utils/recoveryCode";

type Role = "dm" | "player";

/**
 * Generates a recovery code for the given user and writes it atomically to:
 *   identityRecovery/{code}  → { uid, role }   (reverse lookup)
 *   identitySecret/{uid}     → { code }         (proof store, rule-side only)
 *
 * Pass existingCode when rotating an existing code — the old identityRecovery
 * entry will be removed in the same batch so no orphan is left behind.
 *
 * Returns the new code so the UI can display it to the user.
 */
export async function registerIdentityRecovery(
  uid: string,
  role: Role,
  existingCode?: string
): Promise<string> {
  const code = generateRecoveryCode();
  const batch = writeBatch(db);

  // Remove old reverse-lookup entry if rotating the code
  if (existingCode) {
    batch.delete(doc(db, "identityRecovery", existingCode));
  }

  batch.set(doc(db, "identityRecovery", code), { uid, role });
  batch.set(doc(db, "identitySecret", uid), { code });

  await batch.commit();
  return code;
}

/**
 * Removes both identity recovery documents for a user.
 * Called when a user explicitly opts out of recovery, or before re-registering.
 */
export async function clearIdentityRecovery(uid: string, code: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "identityRecovery", code));
  batch.delete(doc(db, "identitySecret", uid));
  await batch.commit();
}
