// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase";
import { recordAccountDiagnostic } from "../accountDiagnostics";
import { finishAuthStartup, noteAuthStartupWithoutLogin } from "../authStartupDiagnostics";
import { noteCreatedDiagnosticLogin } from "../services/serverAccountDiagnostics";
import { synchroniseUserAccount } from "../services/userAccountService";
import { markApplicationPerformance } from "../performance/performanceMetrics";

interface UseAuthResult {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
  onboarded: boolean | null;
  setOnboarded: (value: boolean) => void;
}

export function useAuth(): UseAuthResult {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // App.tsx's loading gate covers this whole window, so nothing ever
  // reads this value while it's still null.
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let ignore = false;
    let anonymousSignInStarted = false;
    markApplicationPerformance("startup:auth-observer-start");

    const finishWithError = (cause: unknown) => {
      if (ignore) return;
      finishAuthStartup("error", undefined, cause);
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
          if (!ignore) {
            noteAuthStartupWithoutLogin();
            recordAccountDiagnostic("no-restored-login");
          }
          if (anonymousSignInStarted) return;
          anonymousSignInStarted = true;
          markApplicationPerformance("startup:anonymous-sign-in-start");
          try {
            const signedIn = await signInAnonymously(auth);
            noteCreatedDiagnosticLogin(signedIn.user.uid);
            finishAuthStartup("created", signedIn.user.uid);
            recordAccountDiagnostic("anonymous-login-created", { uid: auth.currentUser?.uid });
            markApplicationPerformance("startup:anonymous-sign-in-complete");
          } catch (cause) {
            finishWithError(cause);
          }
          // The observer's signed-in callback owns account synchronisation.
          return;
        }

        if (ignore) return;

        if (!anonymousSignInStarted) finishAuthStartup("restored", user.uid);
        recordAccountDiagnostic("login-received", { uid: user.uid });
        setError(null);
        setCurrentUser(user);

        try {
          markApplicationPerformance("startup:account-synchronisation-start");
          const userIsOnboarded = await synchroniseUserAccount(user.uid);
          recordAccountDiagnostic("setup-status", { uid: user.uid, onboarded: userIsOnboarded });
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
