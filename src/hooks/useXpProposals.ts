// src/hooks/useXpProposals.ts

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { XpProposalDocument } from "../types/Firestore";

type XpProposalWithId = XpProposalDocument & { id: string };

export function useXpProposals(
  campaignId: string | undefined,
  characterId: string | undefined
): {
  proposals: XpProposalWithId[];
  loading: boolean;
} {
  const [proposals, setProposals] = useState<XpProposalWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId || !characterId) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "campaigns", campaignId, "characters", characterId, "xpProposals"),
      orderBy("proposedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: XpProposalWithId[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<XpProposalDocument, "id">),
      }));
      setProposals(list);
      setLoading(false);
    });

    return () => unsub();
  }, [campaignId, characterId]);

  return { proposals, loading };
}
