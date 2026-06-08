// src/hooks/useCharacterSummaries.ts
// Fetches a lightweight list of character summaries for a campaign.

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { charactersCollectionRef } from "../firebase/converters";
import { useToast } from "../components/Toast/ToastContext";

export type CharacterSummary = {
  id: string;
  characterName: string;
  userId: string | null;
};

export function useCharacterSummaries(campaignId: string | undefined) {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: toastError } = useToast();

  useEffect(() => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      charactersCollectionRef(campaignId),
      (snap) => {
        const list: CharacterSummary[] = snap.docs.map((d) => ({
          id: d.id,
          characterName: d.data().header?.characterName ?? "Unnamed Character",
          userId: d.data().userId ?? null,
        }));
        setCharacters(list);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load character summaries:", err);
        setError("Failed to load characters.");
        setLoading(false);
        toastError("Failed to load character summaries. Please refresh.");
      }
    );

    return () => unsub();
  }, [campaignId, toastError]);

  return { characters, loading, error };
}
