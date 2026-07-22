// src/hooks/usePlayerCharacters.ts

import { charactersCollectionRef } from "../firebase/converters";
import type { CharacterListItem } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function usePlayerCharacters(
  campaignId: string | null,
  userId: string
): { characters: CharacterListItem[]; loading: boolean; error: Error | null } {
  const {
    data: characters,
    loading,
    error,
  } = useQuerySubscription(
    campaignId ? charactersCollectionRef(campaignId) : null,
    campaignId ? `player-characters:${campaignId}:${userId}` : null,
    (snapshot) =>
      snapshot.docs
        .map((characterDocument) => characterDocument.data())
        .filter((character) => character.userId === userId)
  );

  return { characters, loading, error };
}
