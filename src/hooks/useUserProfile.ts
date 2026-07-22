// src/hooks/useUserProfile.ts
//
// Live subscription to a user's public first name at /userProfiles/{uid}.
// Used to display the owner's name on character sheets without reading their
// private /users doc.

import { doc, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfileDocument } from "../types/Firestore";
import { useDocumentSubscription } from "./useFirestoreSubscription";

interface UserProfileState {
  firstName: string | null;
  loading: boolean;
  error: Error | null;
}

export function useUserProfile(uid: string | null | undefined): UserProfileState {
  const {
    data: firstName,
    loading,
    error,
  } = useDocumentSubscription<DocumentData, string>(
    uid ? doc(db, "userProfiles", uid) : null,
    (snapshot) =>
      snapshot.exists() ? (snapshot.data() as UserProfileDocument).firstName?.trim() || null : null
  );

  return { firstName, loading, error };
}
