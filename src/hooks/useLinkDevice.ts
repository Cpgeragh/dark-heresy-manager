// src/hooks/useLinkDevice.ts
// Coordinates loading and error state while deviceLinkService performs the
// recovery-code validation, proof lifecycle, and link write.

import { useRef, useState } from "react";
import { auth } from "../firebase";
import { linkDeviceToAccount } from "../services/deviceLinkService";

export function useLinkDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkingRef = useRef<Promise<void> | null>(null);

  async function linkDevice(recoveryCode: string) {
    if (linkingRef.current) return linkingRef.current;
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");

    setLoading(true);
    setError(null);

    const operation = (async () => {
      try {
        await linkDeviceToAccount(user.uid, recoveryCode);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to link device.";
        setError(message);
        throw err;
      } finally {
        linkingRef.current = null;
        setLoading(false);
      }
    })();
    linkingRef.current = operation;
    return operation;
  }

  return { linkDevice, loading, error };
}
