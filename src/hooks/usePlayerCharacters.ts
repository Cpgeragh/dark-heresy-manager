// src/hooks/usePlayerCharacters.ts

import { limit, query, where } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
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
    campaignId && userId
      ? query(
          charactersCollectionRef(campaignId),
          where("userId", "==", userId),
          limit(FIRESTORE_QUERY_LIMITS.playerCharactersPerCampaign)
        )
      : null,
    campaignId && userId ? `player-characters:${campaignId}:${userId}` : null,
    (snapshot) => snapshot.docs.map((characterDocument) => characterDocument.data())
  );

  return { characters, loading, error };
}
