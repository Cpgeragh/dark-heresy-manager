// src/hooks/useRecoveryLookup.ts

import { useState, useCallback, useRef } from "react";
import { lookupRecoveryCharacter } from "../services/recoveryLookupService";
import type { RecoveryLookupResult } from "../types/Recovery";
import { ClientCodeAttemptLimitError } from "../utils/clientCodeAttemptLimit";

export function useRecoveryLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecoveryLookupResult | null>(null);
  const requestIdRef = useRef(0);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const lookup = useCallback(async (code: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const outcome = await lookupRecoveryCharacter(code);
      if (requestId !== requestIdRef.current) return;
      if (outcome.status === "not-found") {
        setError("No character found with this recovery code.");
        return;
      }
      if (outcome.status === "missing-data") {
        setError("Recovery code points to missing data.");
        return;
      }
      setData(outcome.result);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Recovery code lookup failed:", err);
      setError(
        err instanceof ClientCodeAttemptLimitError ? err.message : "Unexpected error during lookup."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { loading, error, data, lookup, reset };
}
