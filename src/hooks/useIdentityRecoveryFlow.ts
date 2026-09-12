import { useCallback, useRef, useState } from "react";
import { useLinkDevice } from "./useLinkDevice";
import { formatRecoveryCodeInput } from "../utils/recoveryCode";
import { validateRecoveryCode } from "../utils/validation";

export type IdentityRecoveryPhase = "idle" | "linking" | "finishing";

export function useIdentityRecoveryFlow() {
  const {
    linkDevice,
    loading: linkRequestPending,
    error: linkError,
    reset: resetLinkDevice,
  } = useLinkDevice();
  const [code, setStoredCode] = useState("");
  const [phase, setPhase] = useState<IdentityRecoveryPhase>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const operationRef = useRef(false);
  const operationVersionRef = useRef(0);

  const setCode = useCallback((value: string) => {
    setStoredCode(formatRecoveryCodeInput(value));
    setLocalError(null);
  }, []);

  const reset = useCallback(() => {
    operationVersionRef.current += 1;
    operationRef.current = false;
    setStoredCode("");
    setPhase("idle");
    setLocalError(null);
    resetLinkDevice();
  }, [resetLinkDevice]);

  const failCompletion = useCallback((message: string) => {
    operationRef.current = false;
    setPhase("idle");
    setLocalError(message);
  }, []);

  const link = useCallback(
    async (onSuccess?: () => void | Promise<void>) => {
      if (operationRef.current || phase !== "idle" || !validateRecoveryCode(code).isValid) return;
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
    [code, linkDevice, phase]
  );

  return {
    code,
    phase,
    error: linkError || localError,
    linkRequestPending,
    setCode,
    link,
    reset,
    failCompletion,
  };
}

export type IdentityRecoveryFlow = ReturnType<typeof useIdentityRecoveryFlow>;
