// src/hooks/useCharacterSummaries.ts
// Fetches a lightweight list of character summaries for a campaign.

import { useEffect } from "react";
import { charactersCollectionRef } from "../firebase/converters";
import { useToast } from "../components/Toast/ToastContext";
import { useQuerySubscription } from "./useFirestoreSubscription";

export type CharacterSummary = {
  id: string;
  characterName: string;
  userId: string | null;
};

export function useCharacterSummaries(campaignId: string | undefined) {
  const { error: toastError } = useToast();
  const {
    data: characters,
    loading,
    error,
  } = useQuerySubscription(
    campaignId ? charactersCollectionRef(campaignId) : null,
    campaignId ? `character-summaries:${campaignId}` : null,
    (snapshot) =>
      snapshot.docs.map((characterDocument) => ({
        id: characterDocument.id,
        characterName: characterDocument.data().header?.characterName ?? "Unnamed Character",
        userId: characterDocument.data().userId ?? null,
      }))
  );

  useEffect(() => {
    if (error) toastError("Failed to load character summaries. Please refresh.");
  }, [error, toastError]);

  return { characters, loading, error };
}
