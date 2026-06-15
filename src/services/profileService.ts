// src/services/profileService.ts
//
// Reads/writes the public first-name directory at /userProfiles/{uid}.
// First name only — see Firestore rules and UserProfileDocument.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfileDocument } from "../types/Firestore";

export async function getFirstName(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "userProfiles", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfileDocument;
  return data.firstName?.trim() || null;
}

export async function saveFirstName(uid: string, firstName: string): Promise<void> {
  await setDoc(doc(db, "userProfiles", uid), { firstName: firstName.trim() });
}
