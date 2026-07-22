// src/hooks/useClaimLogs.ts

import { collection, orderBy, query } from "firebase/firestore";

import { db } from "../firebase";
import type { ClaimLogEntry } from "../utils/claimLog";
import { validateClaimLogPayload } from "../utils/claimLog";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useClaimLogs(
  campaignId: string | null,
  characterId: string | null,
  enabled = true
) {
  const active = enabled && campaignId && characterId;
  const {
    data: logs,
    loading,
    error,
  } = useQuerySubscription(
    active
      ? query(
          collection(db, "campaigns", campaignId, "characters", characterId, "claimLog"),
          orderBy("timestamp", "desc")
        )
      : null,
    active ? `claim-logs:${campaignId}:${characterId}` : null,
    (snapshot) => {
      const results: ClaimLogEntry[] = [];

      snapshot.forEach((claimLogDocument) => {
        const data = claimLogDocument.data();

        if (validateClaimLogPayload(data)) {
          results.push({
            id: claimLogDocument.id,
            ...data,
          });
        }
      });

      return results;
    }
  );

  return { logs, loading, error };
}
