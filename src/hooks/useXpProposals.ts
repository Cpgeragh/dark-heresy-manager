// src/hooks/useXpProposals.ts

import { collection, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { XpProposalDocument } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

type XpProposalWithId = XpProposalDocument & { id: string };

export function useXpProposals(
  campaignId: string | undefined,
  characterId: string | undefined
): {
  proposals: XpProposalWithId[];
  loading: boolean;
  error: Error | null;
} {
  const {
    data: proposals,
    loading,
    error,
  } = useQuerySubscription(
    campaignId && characterId
      ? query(
          collection(db, "campaigns", campaignId, "characters", characterId, "xpProposals"),
          orderBy("proposedAt", "desc")
        )
      : null,
    campaignId && characterId ? `xp-proposals:${campaignId}:${characterId}` : null,
    (snapshot) =>
      snapshot.docs.map((proposalDocument) => ({
        id: proposalDocument.id,
        ...(proposalDocument.data() as Omit<XpProposalDocument, "id">),
      }))
  );

  return { proposals, loading, error };
}
