// src/hooks/useClaimLogs.ts

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type FirestoreError,
} from "firebase/firestore";

import { db } from "../firebase";
import type { ClaimLogEntry } from "../utils/claimLog";
import { validateClaimLogPayload } from "../utils/claimLog";

export function useClaimLogs(
  campaignId: string | null,
  characterId: string | null,
  enabled = true
) {
  const [logs, setLogs] = useState<ClaimLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!enabled || !campaignId || !characterId) {
      setLoading(false);
      return;
    }

    const ref = collection(
      db,
      "campaigns",
      campaignId,
      "characters",
      characterId,
      "claimLog"
    );

    const q = query(ref, orderBy("timestamp", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results: ClaimLogEntry[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          if (validateClaimLogPayload(data)) {
            results.push({
              id: docSnap.id,
              ...data,
            });
          }
        });

        setLogs(results);
        setLoading(false);
      },
      (err) => {
        console.error("useClaimLogs error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [campaignId, characterId, enabled]);

  return { logs, loading, error };
}