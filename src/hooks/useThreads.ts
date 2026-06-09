// src/hooks/useThreads.ts
// Real-time listener for all thread summaries in a campaign (DM inbox).

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { ThreadSummary } from "../types/Firestore";

export function useThreads(campaignId: string | null) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "campaigns", campaignId, "threads"),
        orderBy("lastTimestamp", "desc")
      ),
      (snap) => {
        setThreads(snap.docs.map((d) => d.data() as ThreadSummary));
        setLoading(false);
      },
      (err) => {
        console.error("useThreads error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [campaignId]);

  return { threads, loading };
}
