// src/hooks/useCharacterData.ts

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { characterDocRef } from "../firebase/converters";
import type { CharacterDocument, ClaimLogDocument } from "../types/Firestore";

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
}

export function useCharacterData({
  campaignId,
  characterId,
  isDM,
}: UseCharacterDataArgs): UseCharacterDataResult {
  const [character, setCharacter] = useState<Character | null>(null);
  const [claimLog, setClaimLog] = useState<ClaimLog[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // Live character subscription
  // -------------------------------------------------------------
  useEffect(() => {
    if (!campaignId || !characterId) {
      setCharacter(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Use converter for type safety and consistent data transformation
    const ref = characterDocRef(campaignId, characterId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setCharacter(null);
        setLoading(false);
        return;
      }

      // Converter handles data transformation (adds id, handles types)
      const data = snap.data();
      setCharacter(data);
      setLoading(false);
    });

    return () => unsub();
  }, [campaignId, characterId]);

  // -------------------------------------------------------------
  // Claim log subscription (DM only)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!campaignId || !characterId || !isDM) {
      setClaimLog([]);
      return;
    }

    const logsRef = collection(
      db,
      "campaigns",
      campaignId,
      "characters",
      characterId,
      "claimLog"
    );

    const q = query(logsRef, orderBy("timestamp", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: ClaimLog[] = snap.docs.map((d) => {
        const data = d.data() as Omit<ClaimLog, "id">;
        return { id: d.id, ...data };
      });

      setClaimLog(list);
    });

    return () => unsub();
  }, [campaignId, characterId, isDM]);

  return { character, claimLog, loading };
}