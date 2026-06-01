// src/hooks/usePlayerCharacters.ts

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { CharacterListItem } from "../types/Firestore";

export function usePlayerCharacters(
  campaignId: string | null,
  userId: string
): { characters: CharacterListItem[]; loading: boolean } {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setCharacters([]);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "campaigns", campaignId, "characters"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<CharacterListItem, "id">) }))
          .filter((c) => c.userId === userId);
        setCharacters(list);
        setLoading(false);
      },
      (err) => {
        console.error("usePlayerCharacters snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [campaignId, userId]);

  return { characters, loading };
}
