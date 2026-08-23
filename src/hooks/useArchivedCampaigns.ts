// src/hooks/useArchivedCampaigns.ts
// Real-time listener for a DM's archived campaigns (archivedAt != null).

import { limit, query, where } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
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
      ? query(
          campaignsCollectionRef(),
          where("dmId", "==", uid),
          where("archivedAt", "!=", null),
          limit(FIRESTORE_QUERY_LIMITS.archivedCampaigns)
        )
      : null,
    uid ? `archived-campaigns:${uid}` : null,
    (snapshot) => snapshot.docs.map((campaignDocument) => campaignDocument.data())
  );

  return { campaigns: campaigns as CampaignWithId[], loading, error };
}
