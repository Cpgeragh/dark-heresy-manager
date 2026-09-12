import { signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase";
import type { UserDocument } from "../types/Firestore";
import { assertFirestoreDocumentId } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";

const callDeleteAccount = httpsCallable<
  Record<string, never>,
  { releasedCharacters: number; removedLinkedDevices: number }
>(functions, "deleteAccount");

const callDiscardOnboardingSetup = httpsCallable<Record<string, never>, void>(
  functions,
  "discardOnboardingSetup"
);

const callCompleteOnboarding = httpsCallable<Record<string, never>, void>(
  functions,
  "completeOnboarding"
);

/**
 * Ensures the anonymous-auth user has an account document and returns whether
 * onboarding has been completed. Existing accounts are read-only on startup;
 * routine app launches must not create a billed heartbeat write.
 */
export async function synchroniseUserAccount(uid: string): Promise<boolean> {
  assertFirestoreDocumentId(uid, "User ID");
  const reference = doc(db, "users", uid);
  const snapshot = await getDoc(reference);

  let onboarded = true;
  if (!snapshot.exists()) {
    const newUserDocument: UserDocument = {
      createdAt: serverTimestamp(),
      onboarded: false,
    };
    await setDoc(reference, newUserDocument);
    onboarded = false;
  } else {
    // Missing means a legacy user created before onboarding existed.
    onboarded = (snapshot.data() as UserDocument).onboarded !== false;
  }
  return onboarded;
}

/**
 * Returns whether an existing device user document still needs its recovery
 * code backed up. Missing user documents do not produce a backup prompt.
 */
export async function needsRecoveryCodeBackup(uid: string): Promise<boolean> {
  assertFirestoreDocumentId(uid, "User ID");
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return false;

  const user = snapshot.data() as Pick<UserDocument, "recoveryBackedUp">;
  return user.recoveryBackedUp !== true;
}

/** Marks the current device user's recovery code as safely backed up. */
export async function markRecoveryCodeBackedUp(uid: string): Promise<void> {
  assertFirestoreDocumentId(uid, "User ID");
  await updateDoc(doc(db, "users", uid), { recoveryBackedUp: true });
}

/** Completes first-run onboarding after the recovery code is saved. */
export async function completeOnboarding(): Promise<void> {
  await runSingleFlight("account:complete-onboarding", [], async () => {
    await callCompleteOnboarding({});
  });
}

/** Removes provisional profile and recovery data before leaving unfinished onboarding. */
export async function discardOnboardingSetup(): Promise<void> {
  await runSingleFlight("account:discard-onboarding", [], async () => {
    await callDiscardOnboardingSetup({});
  });
}

/** Deletes the connected account, then clears the deleted local session. */
export async function deleteCurrentAccount(): Promise<void> {
  await runSingleFlight("account:delete", [], async () => {
    await callDeleteAccount({});
    await signOut(auth);
    window.location.reload();
  });
}
