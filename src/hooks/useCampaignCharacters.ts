// src/hooks/useCampaignCharacters.ts
// Real-time subscription to characters in the active campaign.

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { CharacterListItem } from "../types/Firestore";

export function useCampaignCharacters(campaignId: string | null) {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);

  useEffect(() => {
    if (!campaignId) {
      setCharacters([]);
      return;
    }

    const ref = collection(db, "campaigns", campaignId, "characters");

    const unsub = onSnapshot(ref, (snap) => {
      const list: CharacterListItem[] = snap.docs.map((c) => {
        const data = c.data() as Omit<CharacterListItem, "id">;
        return { id: c.id, ...data };
      });
      setCharacters(list);
    });

    return () => unsub();
  }, [campaignId]);

  return { characters };
}
