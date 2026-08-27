// src/hooks/useCampaignCharacterSummaries.ts
// Real-time subscription to a campaign's restricted character summaries —
// name, player name, portrait, career, rank only. Powers the player-facing
// party roster; never carries a Recovery Code.

import { useEffect } from "react";
import { limit, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { characterSummariesCollectionRef } from "../firebase/converters";
import { useToast } from "../components/Toast/ToastContext";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useCampaignCharacterSummaries(campaignId: string | null) {
  const { error: toastError } = useToast();
  const {
    data: summaries,
    loading,
    error,
  } = useQuerySubscription(
    campaignId
      ? query(
          characterSummariesCollectionRef(campaignId),
          limit(FIRESTORE_QUERY_LIMITS.charactersPerCampaign)
        )
      : null,
    campaignId ? `campaign-character-summaries:${campaignId}` : null,
    (snapshot) => snapshot.docs.map((summaryDocument) => summaryDocument.data())
  );

  useEffect(() => {
    if (error) toastError("Failed to load the party roster. Please refresh the page.");
  }, [error, toastError]);

  return { summaries, loading, error };
}
