// src/hooks/usePlayerCharacters.ts

import { collection } from "firebase/firestore";
import { db } from "../firebase";
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
    campaignId ? collection(db, "campaigns", campaignId, "characters") : null,
    campaignId ? `player-characters:${campaignId}:${userId}` : null,
    (snapshot) =>
      snapshot.docs
        .map((characterDocument) => ({
          id: characterDocument.id,
          ...(characterDocument.data() as Omit<CharacterListItem, "id">),
        }))
        .filter((character) => character.userId === userId)
  );

  return { characters, loading, error };
}
