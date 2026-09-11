// src/hooks/useLinkDevice.ts
// Coordinates loading and error state while deviceLinkService performs the
// recovery-code validation, proof lifecycle, and link write.

import { useCallback, useRef, useState } from "react";
import { auth } from "../firebase";
import { linkDeviceToAccount } from "../services/deviceLinkService";

export function useLinkDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkingRef = useRef<Promise<void> | null>(null);
  const requestVersionRef = useRef(0);

  const linkDevice = useCallback(async (recoveryCode: string) => {
    if (linkingRef.current) return linkingRef.current;
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");

    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setError(null);

    const operation = (async () => {
      try {
        await linkDeviceToAccount(user.uid, recoveryCode);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to link device.";
        console.error("Failed to link device:", err);
        if (requestVersionRef.current === requestVersion) setError(message);
        throw err;
      } finally {
        if (requestVersionRef.current === requestVersion) {
          linkingRef.current = null;
          setLoading(false);
        }
      }
    })();
    linkingRef.current = operation;
    return operation;
  }, []);

  const reset = useCallback(() => {
    requestVersionRef.current += 1;
    linkingRef.current = null;
    setLoading(false);
    setError(null);
  }, []);

  return { linkDevice, loading, error, reset };
}
