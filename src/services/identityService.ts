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
  limit,
  type DocumentReference,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import {
  assertBulkOperationCount,
  assertFirestoreDocumentId,
  assertRecoveryCode,
} from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";

const IDENTITY_RECLAIM_CAMPAIGN_LIMIT = 50;
const IDENTITY_RECLAIM_CHARACTERS_PER_CAMPAIGN_LIMIT = 20;
const IDENTITY_RECLAIM_WRITE_LIMIT = PRODUCT_LIMITS.bulkOperationDocuments;

function protectedReclaimError(): Error {
  return new Error(
    "This account has too much data for a safe on-device recovery. No ownership was changed. Please use the protected recovery process."
  );
}

const callRegisterIdentityCode = httpsCallable<
  { role: "dm" | "player"; targetUid?: string },
  { code: string }
>(functions, "registerIdentityCode");

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
  assertFirestoreDocumentId(uid, "User ID");
  assertRecoveryCode(code);
  const normalisedCode = code.trim();
  return runSingleFlight("identity:reclaim", [uid, normalisedCode], async () => {
    // 1. Look up the recovery entry
    const recoveryRef = doc(db, "identityRecovery", normalisedCode);
    const recoverySnap = await getDoc(recoveryRef);

    if (!recoverySnap.exists()) {
      throw new Error("Recovery code not found.");
    }

    const { uid: oldUid, role } = recoverySnap.data() as { uid: string; role?: "dm" | "player" };
    assertFirestoreDocumentId(oldUid, "Recovered user ID");
    if (role !== undefined && role !== "dm" && role !== "player") {
      throw new Error("Recovery role is invalid.");
    }

    if (oldUid === uid) {
      throw new Error("This code is already registered to your account.");
    }

    // 2. Write the reclaim proof — Firestore rule verifies code against identitySecret
    const reclaimRef = doc(db, "identityReclaims", uid);
    await setDoc(reclaimRef, { oldUid, code: normalisedCode });

    try {
      // Read everything first, then apply ALL ownership migrations in a single
      // atomic batch, so a failure can't leave the account half-migrated.
      const dmCampaignsSnap = await getDocs(
        query(
          collection(db, "campaigns"),
          where("dmId", "==", oldUid),
          limit(IDENTITY_RECLAIM_CAMPAIGN_LIMIT + 1)
        )
      );
      const playerCampaignsSnap = await getDocs(
        query(
          collection(db, "campaigns"),
          where("memberIds", "array-contains", oldUid),
          limit(IDENTITY_RECLAIM_CAMPAIGN_LIMIT + 1)
        )
      );

      if (
        dmCampaignsSnap.docs.length > IDENTITY_RECLAIM_CAMPAIGN_LIMIT ||
        playerCampaignsSnap.docs.length > IDENTITY_RECLAIM_CAMPAIGN_LIMIT
      ) {
        throw protectedReclaimError();
      }

      const campaignMigrations = new Map<
        string,
        {
          campaignRef: DocumentReference;
          changes: { dmId?: string; memberIds?: string[] };
          characterRefs: DocumentReference[];
        }
      >();

      dmCampaignsSnap.docs.forEach((campaignDoc) => {
        campaignMigrations.set(campaignDoc.id, {
          campaignRef: campaignDoc.ref,
          changes: { dmId: uid },
          characterRefs: [],
        });
      });

      // Read and validate all player-owned data before staging any ownership write.
      for (const campDoc of playerCampaignsSnap.docs) {
        const campData = campDoc.data() as { memberIds: string[] };
        const newMemberIds = campData.memberIds.filter((id) => id !== oldUid).concat(uid);

        const charsSnap = await getDocs(
          query(
            collection(db, "campaigns", campDoc.id, "characters"),
            where("userId", "==", oldUid),
            limit(IDENTITY_RECLAIM_CHARACTERS_PER_CAMPAIGN_LIMIT + 1)
          )
        );

        if (charsSnap.docs.length > IDENTITY_RECLAIM_CHARACTERS_PER_CAMPAIGN_LIMIT) {
          throw protectedReclaimError();
        }

        const existingMigration = campaignMigrations.get(campDoc.id);
        campaignMigrations.set(campDoc.id, {
          campaignRef: campDoc.ref,
          changes: { ...existingMigration?.changes, memberIds: newMemberIds },
          characterRefs: charsSnap.docs.map((characterDoc) => characterDoc.ref),
        });
      }

      const ownershipWriteCount =
        campaignMigrations.size +
        [...campaignMigrations.values()].reduce(
          (count, migration) => count + migration.characterRefs.length,
          0
        );

      if (ownershipWriteCount > IDENTITY_RECLAIM_WRITE_LIMIT) {
        throw protectedReclaimError();
      }
      assertBulkOperationCount(ownershipWriteCount, "Identity recovery");

      const batch = writeBatch(db);

      campaignMigrations.forEach((migration) => {
        batch.update(migration.campaignRef, migration.changes);
        migration.characterRefs.forEach((characterRef) =>
          batch.update(characterRef, { userId: uid })
        );
      });

      await batch.commit();

      // Transfer the recovery entry + secret to the new uid, and mark it onboarded.
      await updateDoc(recoveryRef, { uid });
      await setDoc(doc(db, "identitySecret", uid), { code: normalisedCode });
      await setDoc(doc(db, "users", uid), { onboarded: true }, { merge: true });
    } finally {
      // 6. Always clean up the proof document regardless of success or failure
      await deleteDoc(reclaimRef);
    }

    // Recovery entries created before roles were stored default to player.
    return role ?? "player";
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
