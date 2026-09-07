// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase";
import { synchroniseUserAccount } from "../services/userAccountService";
import { markApplicationPerformance } from "../performance/performanceMetrics";

interface UseAuthResult {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
  onboarded: boolean;
  setOnboarded: (value: boolean) => void;
}

export function useAuth(): UseAuthResult {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Default true so existing (legacy) users never see the onboarding screen.
  // Flipped to false only when a brand-new user doc is created.
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    let ignore = false;
    let anonymousSignInStarted = false;
    markApplicationPerformance("startup:auth-observer-start");

    const finishWithError = (cause: unknown) => {
      if (ignore) return;
      const authError = cause instanceof Error ? cause : new Error("Unable to load account.");
      markApplicationPerformance("startup:auth-error");
      markApplicationPerformance("startup:auth-ready");
      console.error("Auth error:", authError);
      setError(authError);
      setLoading(false);
    };

    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        markApplicationPerformance("startup:auth-state-received");
        if (!user) {
          if (anonymousSignInStarted) return;
          anonymousSignInStarted = true;
          markApplicationPerformance("startup:anonymous-sign-in-start");
          try {
            await signInAnonymously(auth);
            markApplicationPerformance("startup:anonymous-sign-in-complete");
          } catch (cause) {
            finishWithError(cause);
          }
          // The observer's signed-in callback owns account synchronisation.
          return;
        }

        if (ignore) return;

        setError(null);
        setCurrentUser(user);

        try {
          markApplicationPerformance("startup:account-synchronisation-start");
          const userIsOnboarded = await synchroniseUserAccount(user.uid);
          markApplicationPerformance("startup:account-synchronisation-complete");

          if (ignore) return;
          setOnboarded(userIsOnboarded);
          markApplicationPerformance("startup:auth-ready");
          setLoading(false);
        } catch (cause) {
          finishWithError(cause);
        }
      },
      finishWithError
    );

    return () => {
      ignore = true;
      unsub();
    };
  }, []);

  return {
    currentUser,
    loading,
    error,
    onboarded,
    setOnboarded,
  };
}
