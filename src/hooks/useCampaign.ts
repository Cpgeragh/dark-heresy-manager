// src/hooks/useCampaign.ts
// Real-time listener for a single campaign document.

import { campaignDocRef } from "../firebase/converters";
import type { CampaignWithId } from "../types/Firestore";
import { useDocumentSubscription } from "./useFirestoreSubscription";

export function useCampaign(campaignId: string | null) {
  const {
    data: campaign,
    loading,
    error,
  } = useDocumentSubscription<CampaignWithId, CampaignWithId>(
    campaignId ? campaignDocRef(campaignId) : null,
    (snapshot) => (snapshot.exists() ? snapshot.data() : null)
  );

  return { campaign, loading, error };
}
