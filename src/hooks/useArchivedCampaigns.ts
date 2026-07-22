// src/hooks/useArchivedCampaigns.ts
// Real-time listener for a DM's archived campaigns (archivedAt != null).

import { query, where } from "firebase/firestore";
import { campaignsCollectionRef } from "../firebase/converters";
import type { CampaignWithId } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useArchivedCampaigns(uid: string) {
  const {
    data: campaigns,
    loading,
    error,
  } = useQuerySubscription(
    uid
      ? query(campaignsCollectionRef(), where("dmId", "==", uid), where("archivedAt", "!=", null))
      : null,
    uid ? `archived-campaigns:${uid}` : null,
    (snapshot) => snapshot.docs.map((campaignDocument) => campaignDocument.data())
  );

  return { campaigns: campaigns as CampaignWithId[], loading, error };
}
