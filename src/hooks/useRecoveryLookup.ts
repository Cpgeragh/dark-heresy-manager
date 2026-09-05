// src/hooks/useRecoveryLookup.ts

import { useState, useCallback } from "react";
import { lookupRecoveryCharacter } from "../services/recoveryLookupService";
import type { RecoveryLookupResult } from "../types/Recovery";
import { ClientCodeAttemptLimitError } from "../utils/clientCodeAttemptLimit";

export function useRecoveryLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecoveryLookupResult | null>(null);

  const lookup = useCallback(async (code: string) => {
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const outcome = await lookupRecoveryCharacter(code);
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
      console.error(err);
      setError(
        err instanceof ClientCodeAttemptLimitError ? err.message : "Unexpected error during lookup."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, lookup };
}
