// src/hooks/useThreads.ts
// Real-time listener for all thread summaries in a campaign (DM inbox).

import { collection, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { ThreadSummary } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useThreads(campaignId: string | null) {
  const {
    data: threads,
    loading,
    error,
  } = useQuerySubscription(
    campaignId
      ? query(collection(db, "campaigns", campaignId, "threads"), orderBy("lastTimestamp", "desc"))
      : null,
    campaignId ? `threads:${campaignId}` : null,
    (snapshot) => snapshot.docs.map((threadDocument) => threadDocument.data() as ThreadSummary)
  );

  return { threads, loading, error };
}
