import { useCallback, useRef, useState } from "react";
import { useLinkDevice } from "./useLinkDevice";
import {
  getIdentityRecoveryMode,
  reclaimIdentity,
  type ReclaimIdentityResult,
} from "../services/identityService";
import { formatRecoveryCodeInput } from "../utils/recoveryCode";
import { validateRecoveryCode } from "../utils/validation";

export type IdentityRecoveryMode = "link" | "reclaim";
export type IdentityRecoveryPhase = "idle" | "checking" | "linking" | "reclaiming" | "finishing";

export function useIdentityRecoveryFlow() {
  const {
    linkDevice,
    loading: linkRequestPending,
    error: linkError,
    reset: resetLinkDevice,
  } = useLinkDevice();
  const [code, setStoredCode] = useState("");
  const [mode, setMode] = useState<IdentityRecoveryMode | null>(null);
  const [phase, setPhase] = useState<IdentityRecoveryPhase>("idle");
  const [progress, setProgress] = useState<{ processedCount: number; totalCount: number } | null>(
    null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const operationRef = useRef(false);
  const operationVersionRef = useRef(0);

  const setCode = useCallback((value: string) => {
    setStoredCode(formatRecoveryCodeInput(value));
    setMode(null);
    setLocalError(null);
  }, []);

  const reset = useCallback(() => {
    operationVersionRef.current += 1;
    operationRef.current = false;
    setStoredCode("");
    setMode(null);
    setPhase("idle");
    setProgress(null);
    setLocalError(null);
    resetLinkDevice();
  }, [resetLinkDevice]);

  const failCompletion = useCallback((message: string) => {
    operationRef.current = false;
    setPhase("idle");
    setProgress(null);
    setLocalError(message);
  }, []);

  const check = useCallback(async () => {
    if (operationRef.current || phase !== "idle" || !validateRecoveryCode(code).isValid) return;
    const operationVersion = ++operationVersionRef.current;
    operationRef.current = true;
    setPhase("checking");
    setMode(null);
    setLocalError(null);
    try {
      const nextMode = await getIdentityRecoveryMode(code);
      if (operationVersionRef.current === operationVersion) setMode(nextMode);
    } catch (error) {
      if (operationVersionRef.current === operationVersion) {
        setLocalError(
          error instanceof Error ? error.message : "Unable to check this recovery code."
        );
      }
    } finally {
      if (operationVersionRef.current === operationVersion) {
        operationRef.current = false;
        setPhase("idle");
      }
    }
  }, [code, phase]);

  const link = useCallback(
    async (onSuccess?: () => void | Promise<void>) => {
      if (operationRef.current || phase !== "idle" || mode !== "link") return;
      const operationVersion = ++operationVersionRef.current;
      operationRef.current = true;
      setPhase("linking");
      setLocalError(null);
      try {
        await linkDevice(code);
        if (operationVersionRef.current !== operationVersion) return;
        await onSuccess?.();
        if (operationVersionRef.current === operationVersion) setPhase("finishing");
      } catch {
        if (operationVersionRef.current === operationVersion) {
          operationRef.current = false;
          setPhase("idle");
        }
      }
    },
    [code, linkDevice, mode, phase]
  );

  const reclaim = useCallback(
    async (onSuccess?: (result: ReclaimIdentityResult) => void | Promise<void>) => {
      if (operationRef.current || phase !== "idle" || mode !== "reclaim") return;
      const operationVersion = ++operationVersionRef.current;
      operationRef.current = true;
      setPhase("reclaiming");
      setProgress(null);
      setLocalError(null);
      try {
        const result = await reclaimIdentity(code, (progress) => {
          if (operationVersionRef.current === operationVersion) setProgress(progress);
        });
        if (operationVersionRef.current !== operationVersion) return;
        if (!result.profileTransferred) {
          throw new Error("Reclaim completed without the saved profile. Please try again.");
        }
        await onSuccess?.(result);
        if (operationVersionRef.current === operationVersion) setPhase("finishing");
      } catch (error) {
        if (operationVersionRef.current === operationVersion) {
          operationRef.current = false;
          setPhase("idle");
          setProgress(null);
          setLocalError(error instanceof Error ? error.message : "Unable to reclaim this account.");
        }
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
