// src/hooks/useCampaignCharacters.ts
// Real-time subscription to the signed-in player's own characters in the
// active campaign. The DM's admin list uses useCampaignCharacterSummaries
// instead, since it never needs full character documents.

import { useEffect } from "react";
import { limit, query, where } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { charactersCollectionRef } from "../firebase/converters";
import { useToast } from "../components/Toast/ToastContext";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useCampaignCharacters(campaignId: string | null, userId: string | null) {
  const { error: toastError } = useToast();
  const active = campaignId !== null && userId !== null;
  const {
    data: characters,
    loading,
    error,
  } = useQuerySubscription(
    active
      ? query(
          charactersCollectionRef(campaignId),
          where("userId", "==", userId),
          limit(FIRESTORE_QUERY_LIMITS.charactersPerCampaign)
        )
      : null,
    active ? `campaign-characters:${campaignId}:owner:${userId}` : null,
    (snapshot) => snapshot.docs.map((characterDocument) => characterDocument.data())
  );

  useEffect(() => {
    if (error) toastError("Failed to load characters. Please refresh the page.");
  }, [error, toastError]);

  return { characters, loading, error };
}
