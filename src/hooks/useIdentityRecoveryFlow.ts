import { useCallback, useRef, useState } from "react";
import { useLinkDevice } from "./useLinkDevice";
import {
  getIdentityRecoveryMode,
  reclaimIdentity,
  type ReclaimIdentityResult,
} from "../services/identityService";
import { formatRecoveryCodeInput } from "../utils/recoveryCode";

export type IdentityRecoveryMode = "link" | "reclaim";
export type IdentityRecoveryPhase = "idle" | "checking" | "linking" | "reclaiming" | "finishing";

export function useIdentityRecoveryFlow() {
  const { linkDevice, loading: linkRequestPending, error: linkError } = useLinkDevice();
  const [code, setStoredCode] = useState("");
  const [mode, setMode] = useState<IdentityRecoveryMode | null>(null);
  const [phase, setPhase] = useState<IdentityRecoveryPhase>("idle");
  const [progress, setProgress] = useState<{ processedCount: number; totalCount: number } | null>(
    null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const operationRef = useRef(false);

  const setCode = useCallback((value: string) => {
    setStoredCode(formatRecoveryCodeInput(value));
    setMode(null);
    setLocalError(null);
  }, []);

  const reset = useCallback(() => {
    operationRef.current = false;
    setMode(null);
    setPhase("idle");
    setProgress(null);
    setLocalError(null);
  }, []);

  const failCompletion = useCallback((message: string) => {
    operationRef.current = false;
    setPhase("idle");
    setProgress(null);
    setLocalError(message);
  }, []);

  const check = useCallback(async () => {
    if (operationRef.current || phase !== "idle" || !code.trim()) return;
    operationRef.current = true;
    setPhase("checking");
    setMode(null);
    setLocalError(null);
    try {
      setMode(await getIdentityRecoveryMode(code));
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to check this recovery code.");
    } finally {
      operationRef.current = false;
      setPhase("idle");
    }
  }, [code, phase]);

  const link = useCallback(
    async (onSuccess?: () => void | Promise<void>) => {
      if (operationRef.current || phase !== "idle" || mode !== "link") return;
      operationRef.current = true;
      setPhase("linking");
      setLocalError(null);
      try {
        await linkDevice(code);
        await onSuccess?.();
        setPhase("finishing");
      } catch {
        operationRef.current = false;
        setPhase("idle");
      }
    },
    [code, linkDevice, mode, phase]
  );

  const reclaim = useCallback(
    async (onSuccess?: (result: ReclaimIdentityResult) => void | Promise<void>) => {
      if (operationRef.current || phase !== "idle" || mode !== "reclaim") return;
      operationRef.current = true;
      setPhase("reclaiming");
      setProgress(null);
      setLocalError(null);
      try {
        const result = await reclaimIdentity(code, setProgress);
        if (!result.profileTransferred) {
          throw new Error("Reclaim completed without the saved profile. Please try again.");
        }
        await onSuccess?.(result);
        setPhase("finishing");
      } catch (error) {
        operationRef.current = false;
        setPhase("idle");
        setProgress(null);
        setLocalError(error instanceof Error ? error.message : "Unable to reclaim this account.");
      }
    },
    [code, mode, phase]
  );

  return {
    code,
    mode,
    phase,
    progress,
    error: linkError || localError,
    linkRequestPending,
    setCode,
    check,
    link,
    reclaim,
    reset,
    failCompletion,
  };
}

export type IdentityRecoveryFlow = ReturnType<typeof useIdentityRecoveryFlow>;
