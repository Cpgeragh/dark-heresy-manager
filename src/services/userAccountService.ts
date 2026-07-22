import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserDocument } from "../types/Firestore";

/**
 * Returns whether an existing device user document still needs its recovery
 * code backed up. Missing user documents do not produce a backup prompt.
 */
export async function needsRecoveryCodeBackup(uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return false;

  const user = snapshot.data() as Pick<UserDocument, "recoveryBackedUp">;
  return user.recoveryBackedUp !== true;
}

/** Marks the current device user's recovery code as safely backed up. */
export async function markRecoveryCodeBackedUp(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { recoveryBackedUp: true });
}

/** Completes first-run onboarding after the recovery code is saved. */
export async function completeOnboarding(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    onboarded: true,
    recoveryBackedUp: true,
  });
}
