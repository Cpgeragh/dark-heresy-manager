// src/hooks/usePlayerCharacters.ts

import { limit, query, where } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { charactersCollectionGroupRef } from "../firebase/converters";
import type { CharacterListItem } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function usePlayerCharacters(userId: string): {
  characters: CharacterListItem[];
  loading: boolean;
  error: Error | null;
} {
  const {
    data: characters,
    loading,
    error,
  } = useQuerySubscription(
    userId
      ? query(
          charactersCollectionGroupRef(),
          where("userId", "==", userId),
          limit(FIRESTORE_QUERY_LIMITS.playerCharactersPerUser)
        )
      : null,
    userId ? `player-characters:${userId}` : null,
    (snapshot) => snapshot.docs.map((characterDocument) => characterDocument.data())
  );

  return { characters, loading, error };
}
