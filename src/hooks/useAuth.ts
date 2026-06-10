// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth } from "../firebase";
import { userDocRef } from "../firebase/converters";
import type { UserDocument } from "../types/Firestore";

interface UseAuthResult {
  currentUser: User | null;
  loading: boolean;
  onboarded: boolean;
  setOnboarded: (value: boolean) => void;
}

export function useAuth(): UseAuthResult {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Default true so existing (legacy) users never see the onboarding screen.
  // Flipped to false only when a brand-new user doc is created.
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    let ignore = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }

        if (ignore) return;

        setCurrentUser(user);

        const ref = userDocRef(user.uid);
        const snap = await getDoc(ref);

        if (ignore) return;

        if (!snap.exists()) {
          const newUserDoc: UserDocument = {
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
            onboarded: false,
          };

          await setDoc(ref, newUserDoc);

          if (ignore) return;

          setOnboarded(false);
        } else {
          const data = snap.data();

          if (ignore) return;

          // undefined means a legacy user created before onboarding existed — treat as onboarded
          setOnboarded(data.onboarded !== false);
        }

        await updateDoc(ref, { lastSeen: serverTimestamp() });
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    });

    return () => {
      ignore = true;
      unsub();
    };
  }, []);

  return {
    currentUser,
    loading,
    onboarded,
    setOnboarded,
  };
}
