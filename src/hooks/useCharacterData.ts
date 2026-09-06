// src/hooks/useCharacterData.ts

import { characterDocRef } from "../firebase/converters";
import type { CharacterDocument } from "../types/Firestore";
import { useDocumentSubscription } from "./useFirestoreSubscription";

interface UseCharacterDataArgs {
  campaignId?: string;
  characterId?: string;
}

interface UseCharacterDataResult {
  character: CharacterDocument | null;
  loading: boolean;
  error: Error | null;
}

export function useCharacterData({
  campaignId,
  characterId,
}: UseCharacterDataArgs): UseCharacterDataResult {
  const activePath = campaignId && characterId;
  const {
    data: character,
    loading: characterLoading,
    error: characterError,
  } = useDocumentSubscription<CharacterDocument, CharacterDocument>(
    activePath ? characterDocRef(campaignId, characterId) : null,
    (snapshot) => (snapshot.exists() ? snapshot.data() : null)
  );

  return {
    character,
    loading: characterLoading,
    error: characterError,
  };
}
