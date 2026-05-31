// src/hooks/useCharacterSummaries.ts
// Fetches a lightweight list of character summaries for a campaign.

import { useEffect, useState } from "react";
import { getDocs } from "firebase/firestore";
import { charactersCollectionRef } from "../firebase/converters";

export type CharacterSummary = {
  id: string;
  characterName: string;
  userId: string | null;
};

export function useCharacterSummaries(campaignId: string | undefined) {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    let ignore = false;

    async function load() {
      setLoading(true);
      const snap = await getDocs(charactersCollectionRef(campaignId));
      const list: CharacterSummary[] = snap.docs.map((d) => ({
        id: d.id,
        characterName: d.data().header?.characterName ?? "Unnamed Character",
        userId: d.data().userId ?? null,
      }));
      if (!ignore) {
        setCharacters(list);
        setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [campaignId]);

  return { characters, loading };
}
