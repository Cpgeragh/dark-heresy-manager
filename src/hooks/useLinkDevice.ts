// src/hooks/useLinkDevice.ts
// Coordinates loading and error state while deviceLinkService performs the
// recovery-code validation, proof lifecycle, and link write.

import { useState } from "react";
import { auth } from "../firebase";
import { linkDeviceToAccount } from "../services/deviceLinkService";

export function useLinkDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function linkDevice(recoveryCode: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");

    setLoading(true);
    setError(null);

    try {
      await linkDeviceToAccount(user.uid, recoveryCode);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to link device.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { linkDevice, loading, error };
}
