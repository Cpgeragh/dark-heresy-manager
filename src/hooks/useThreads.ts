// src/hooks/useThreads.ts
// Real-time listener for all thread summaries in a campaign (DM inbox).

import { collection, limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
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
      ? query(
          collection(db, "campaigns", campaignId, "threads"),
          orderBy("lastTimestamp", "desc"),
          limit(FIRESTORE_QUERY_LIMITS.threadSummariesPerCampaign)
        )
      : null,
    campaignId ? `threads:${campaignId}` : null,
    (snapshot) => snapshot.docs.map((threadDocument) => threadDocument.data() as ThreadSummary)
  );

  return { threads, loading, error };
}
