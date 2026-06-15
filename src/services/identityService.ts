// src/services/identityService.ts
// Generates and stores a user's identity recovery record.
// One record per user — covers all their campaigns and characters.

import {
  doc,
  writeBatch,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
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
  role: Role = "player",
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
 * Reclaims an identity on a new device using a previously issued recovery code.
 *
 * Flow:
 *  1. Reads identityRecovery/{code} to find the old uid and role.
 *  2. Writes identityReclaims/{uid} as a proof document — the Firestore rule
 *     on this write calls get(identitySecret/oldUid) to verify the code.
 *  3. Migrates campaign dmIds (DM) or character userIds (player) to the new uid.
 *  4. Transfers both identity documents to the new uid.
 *  5. Updates the user document with the reclaimed role.
 *  6. Deletes the proof document.
 *
 * Returns the reclaimed role so the caller can update local app state.
 */
export async function reclaimIdentity(uid: string, code: string): Promise<"dm" | "player"> {
  // 1. Look up the recovery entry
  const recoveryRef = doc(db, "identityRecovery", code);
  const recoverySnap = await getDoc(recoveryRef);

  if (!recoverySnap.exists()) {
    throw new Error("Recovery code not found.");
  }

  const { uid: oldUid, role } = recoverySnap.data() as { uid: string; role?: "dm" | "player" };

  if (oldUid === uid) {
    throw new Error("This code is already registered to your account.");
  }

  // 2. Write the reclaim proof — Firestore rule verifies code against identitySecret
  const reclaimRef = doc(db, "identityReclaims", uid);
  await setDoc(reclaimRef, { oldUid, code });

  try {
    // Read everything first, then apply ALL ownership migrations in a single
    // atomic batch, so a failure can't leave the account half-migrated.
    const dmCampaignsSnap = await getDocs(
      query(collection(db, "campaigns"), where("dmId", "==", oldUid))
    );
    const playerCampaignsSnap = await getDocs(
      query(collection(db, "campaigns"), where("memberIds", "array-contains", oldUid))
    );

    const batch = writeBatch(db);

    // DM data: campaigns owned by the old uid
    dmCampaignsSnap.docs.forEach((d) => batch.update(d.ref, { dmId: uid }));

    // Player data: swap old uid → new uid in memberIds, and migrate owned characters
    for (const campDoc of playerCampaignsSnap.docs) {
      const campData = campDoc.data() as { memberIds: string[] };
      const newMemberIds = campData.memberIds.filter((id) => id !== oldUid).concat(uid);
      batch.update(campDoc.ref, { memberIds: newMemberIds });

      const charsSnap = await getDocs(
        query(
          collection(db, "campaigns", campDoc.id, "characters"),
          where("userId", "==", oldUid)
        )
      );
      charsSnap.docs.forEach((d) => batch.update(d.ref, { userId: uid }));
    }

    await batch.commit();

    // Transfer the recovery entry + secret to the new uid, and mark it onboarded.
    await updateDoc(recoveryRef, { uid });
    await setDoc(doc(db, "identitySecret", uid), { code });
    await setDoc(doc(db, "users", uid), { onboarded: true }, { merge: true });
  } finally {
    // 6. Always clean up the proof document regardless of success or failure
    await deleteDoc(reclaimRef);
  }

  // Return legacy role value for backwards compatibility during transition
  return role ?? "player";
}

/**
 * Reads the user's current recovery code from identitySecret.
 * Returns null if no code exists (e.g. user hasn't completed onboarding).
 */
export async function getRecoveryCode(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "identitySecret", uid));
  if (!snap.exists()) return null;
  return (snap.data() as { code: string }).code;
}

/**
 * Rotates the user's recovery code.
 * Fetches the current code, then calls registerIdentityRecovery with it so the
 * old identityRecovery entry is cleaned up atomically.
 * Returns the new code so the UI can display it.
 */
export async function rotateRecoveryCode(uid: string, role: "dm" | "player" = "player"): Promise<string> {
  const existingCode = await getRecoveryCode(uid);
  return registerIdentityRecovery(uid, role, existingCode ?? undefined);
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
