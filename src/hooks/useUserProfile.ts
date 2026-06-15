// src/hooks/useUserProfile.ts
//
// Live subscription to a user's public first name at /userProfiles/{uid}.
// Used to display the owner's name on character sheets without reading their
// private /users doc.

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfileDocument } from "../types/Firestore";

interface UserProfileState {
  firstName: string | null;
  loading: boolean;
}

export function useUserProfile(uid: string | null | undefined): UserProfileState {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFirstName(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub = onSnapshot(
      doc(db, "userProfiles", uid),
      (snap) => {
        const name = snap.exists()
          ? (snap.data() as UserProfileDocument).firstName?.trim() || null
          : null;
        setFirstName(name);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [uid]);

  return { firstName, loading };
}
