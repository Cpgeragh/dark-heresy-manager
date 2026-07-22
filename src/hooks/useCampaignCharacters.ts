// src/hooks/useCampaignCharacters.ts
// Real-time subscription to characters in the active campaign.

import { useEffect } from "react";
import { collection } from "firebase/firestore";
import { db } from "../firebase";
import type { CharacterListItem } from "../types/Firestore";
import { useToast } from "../components/Toast/ToastContext";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useCampaignCharacters(campaignId: string | null) {
  const { error: toastError } = useToast();
  const {
    data: characters,
    loading,
    error,
  } = useQuerySubscription(
    campaignId ? collection(db, "campaigns", campaignId, "characters") : null,
    campaignId ? `campaign-characters:${campaignId}` : null,
    (snapshot) =>
      snapshot.docs.map((characterDocument) => ({
        id: characterDocument.id,
        ...(characterDocument.data() as Omit<CharacterListItem, "id">),
      }))
  );

  useEffect(() => {
    if (error) toastError("Failed to load characters. Please refresh the page.");
  }, [error, toastError]);

  return { characters, loading, error };
}
