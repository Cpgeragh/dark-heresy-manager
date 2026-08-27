// src/services/profileService.ts
//
// Reads/writes the public first-name directory at /userProfiles/{uid}.
// First name only — see Firestore rules and UserProfileDocument.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfileDocument } from "../types/Firestore";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { assertFirestoreDocumentId, assertString } from "../utils/firebaseValidation";
import { syncGmNameAcrossCampaigns } from "./campaignService";

export async function getFirstName(uid: string): Promise<string | null> {
  assertFirestoreDocumentId(uid, "User ID");
  const snap = await getDoc(doc(db, "userProfiles", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfileDocument;
  return data.firstName?.trim() || null;
}

export async function saveFirstName(uid: string, firstName: string): Promise<void> {
  assertFirestoreDocumentId(uid, "User ID");
  assertString(firstName, "First name");
  const trimmedName = firstName.trim();
  if (!trimmedName) throw new Error("First name is required.");
  if (trimmedName.length > PRODUCT_LIMITS.firstNameCharacters) {
    throw new Error(`First name cannot exceed ${PRODUCT_LIMITS.firstNameCharacters} characters.`);
  }

  await setDoc(doc(db, "userProfiles", uid), { firstName: trimmedName });
  await syncGmNameAcrossCampaigns(uid, trimmedName);
}
