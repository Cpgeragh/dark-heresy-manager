// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase";
import { synchroniseUserAccount } from "../services/userAccountService";

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

        const userIsOnboarded = await synchroniseUserAccount(user.uid);

        if (ignore) return;
        setOnboarded(userIsOnboarded);
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
