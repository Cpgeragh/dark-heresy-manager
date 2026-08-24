// functions/src/operations/reclaimIdentity.ts
//
// Stage 3.3: recovers a whole account identity (DM or player role) on a new
// device via a previously issued identity recovery code. Verifies the code
// directly against identitySecret (the proof-document indirection the
// client uses only exists so Firestore rules can verify it — irrelevant
// here, since this runs via Admin SDK), migrates every campaign/character
// the old identity owned, and transfers the identity documents, all in one
// batch.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  computeOwnershipMigrationPlan,
  applyOwnershipMigrationPlan,
} from "../shared/identityMigration.js";

export interface ReclaimIdentityInput {
  code: string;
}

export async function reclaimIdentity(
  input: ReclaimIdentityInput,
  callerUid: string
): Promise<{ role: "dm" | "player" }> {
  const db = getFirestore();
  const code = input.code.trim();

  const recoverySnapshot = await db.collection("identityRecovery").doc(code).get();
  if (!recoverySnapshot.exists) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const { uid: oldUid, role } = recoverySnapshot.data() as {
    uid: string;
    role?: "dm" | "player";
  };
  if (oldUid === callerUid) {
    throw new HttpsError("failed-precondition", "This code is already registered to your account.");
  }

  const secretSnapshot = await db.collection("identitySecret").doc(oldUid).get();
  if (!secretSnapshot.exists || secretSnapshot.data()?.code !== code) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const plan = await computeOwnershipMigrationPlan(db, oldUid, callerUid);

  const batch = db.batch();
  applyOwnershipMigrationPlan(batch, plan, callerUid);
  batch.update(db.collection("identityRecovery").doc(code), { uid: callerUid });
  batch.set(db.collection("identitySecret").doc(callerUid), { code });
  batch.delete(db.collection("identitySecret").doc(oldUid));
  batch.set(db.collection("users").doc(callerUid), { onboarded: true }, { merge: true });
  await batch.commit();

  return { role: role ?? "player" };
}
