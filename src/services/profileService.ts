// src/services/profileService.ts
//
// Reads/writes the public first-name directory at /userProfiles/{uid}.
// First name only — see Firestore rules and UserProfileDocument.

import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import type { UserProfileDocument } from "../types/Firestore";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { assertFirestoreDocumentId, assertString } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";

const callUpdateDisplayName = httpsCallable<{ firstName: string }, void>(
  functions,
  "updateDisplayName"
);

export async function getFirstName(uid: string): Promise<string | null> {
  assertFirestoreDocumentId(uid, "User ID");
  const snap = await getDoc(doc(db, "userProfiles", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfileDocument;
  return data.firstName?.trim() || null;
}

export async function saveFirstName(firstName: string): Promise<void> {
  assertString(firstName, "First name");
  const trimmedName = firstName.trim();
  if (!trimmedName) throw new Error("First name is required.");
  if (trimmedName.length > PRODUCT_LIMITS.firstNameCharacters) {
    throw new Error(`First name cannot exceed ${PRODUCT_LIMITS.firstNameCharacters} characters.`);
  }

  await runSingleFlight("profile:update-display-name", [trimmedName], async () => {
    await callUpdateDisplayName({ firstName: trimmedName });
  });
}
