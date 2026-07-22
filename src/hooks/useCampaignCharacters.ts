// src/hooks/useCampaignCharacters.ts
// Real-time subscription to characters in the active campaign.

import { useEffect } from "react";
import { charactersCollectionRef } from "../firebase/converters";
import { useToast } from "../components/Toast/ToastContext";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useCampaignCharacters(campaignId: string | null) {
  const { error: toastError } = useToast();
  const {
    data: characters,
    loading,
    error,
  } = useQuerySubscription(
    campaignId ? charactersCollectionRef(campaignId) : null,
    campaignId ? `campaign-characters:${campaignId}` : null,
    (snapshot) => snapshot.docs.map((characterDocument) => characterDocument.data())
  );

  useEffect(() => {
    if (error) toastError("Failed to load characters. Please refresh the page.");
  }, [error, toastError]);

  return { characters, loading, error };
}
