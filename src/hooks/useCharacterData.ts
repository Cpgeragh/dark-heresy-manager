// src/hooks/useCharacterData.ts

import { collection, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { characterDocRef } from "../firebase/converters";
import type { CharacterDocument, ClaimLogDocument } from "../types/Firestore";
import { useDocumentSubscription, useQuerySubscription } from "./useFirestoreSubscription";

// Type aliases for clarity
type Character = CharacterDocument;
type ClaimLog = ClaimLogDocument;

interface UseCharacterDataArgs {
  campaignId?: string;
  characterId?: string;
  isDM: boolean;
}

interface UseCharacterDataResult {
  character: Character | null;
  claimLog: ClaimLog[];
  loading: boolean;
  error: Error | null;
}

export function useCharacterData({
  campaignId,
  characterId,
  isDM,
}: UseCharacterDataArgs): UseCharacterDataResult {
  const activePath = campaignId && characterId;
  const {
    data: character,
    loading: characterLoading,
    error: characterError,
  } = useDocumentSubscription<Character, Character>(
    activePath ? characterDocRef(campaignId, characterId) : null,
    (snapshot) => (snapshot.exists() ? snapshot.data() : null)
  );

  const claimLogActive = activePath && isDM;
  const {
    data: claimLog,
    loading: claimLogLoading,
    error: claimLogError,
  } = useQuerySubscription(
    claimLogActive
      ? query(
          collection(db, "campaigns", campaignId, "characters", characterId, "claimLog"),
          orderBy("timestamp", "desc")
        )
      : null,
    claimLogActive ? `character-claim-log:${campaignId}:${characterId}` : null,
    (snapshot) =>
      snapshot.docs.map((claimLogDocument) => ({
        id: claimLogDocument.id,
        ...(claimLogDocument.data() as Omit<ClaimLog, "id">),
      }))
  );

  return {
    character,
    claimLog,
    loading: characterLoading || claimLogLoading,
    error: characterError ?? claimLogError,
  };
}
