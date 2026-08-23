// src/context/CampaignsContext.tsx
//
// Runs two parallel real-time listeners per uid:
//   - dmCampaigns: campaigns where dmId == uid
//   - playerCampaigns: campaigns where memberIds array-contains uid
//
// Both exclude archived campaigns (archivedAt == null).

import { limit, query, where } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { campaignsCollectionRef } from "../firebase/converters";
import { useQuerySubscription } from "../hooks/useFirestoreSubscription";
import { CampaignsContext } from "./useCampaignsContext";

export function CampaignsProvider({ uid, children }: { uid: string; children: React.ReactNode }) {
  const {
    data: dmCampaigns,
    loading: dmLoading,
    error: dmError,
  } = useQuerySubscription(
    uid
      ? query(
          campaignsCollectionRef(),
          where("dmId", "==", uid),
          where("archivedAt", "==", null),
          limit(FIRESTORE_QUERY_LIMITS.activeCampaignsPerRole)
        )
      : null,
    uid ? `dm-campaigns:${uid}` : null,
    (snapshot) => snapshot.docs.map((campaignDocument) => campaignDocument.data())
  );

  const {
    data: playerCampaigns,
    loading: playerLoading,
    error: playerError,
  } = useQuerySubscription(
    uid
      ? query(
          campaignsCollectionRef(),
          where("memberIds", "array-contains", uid),
          where("archivedAt", "==", null),
          limit(FIRESTORE_QUERY_LIMITS.activeCampaignsPerRole)
        )
      : null,
    uid ? `player-campaigns:${uid}` : null,
    (snapshot) => snapshot.docs.map((campaignDocument) => campaignDocument.data())
  );

  return (
    <CampaignsContext.Provider
      value={{
        dmCampaigns,
        playerCampaigns,
        dmLoading,
        playerLoading,
        loading: dmLoading || playerLoading,
        dmError,
        playerError,
        error: dmError ?? playerError,
      }}
    >
      {children}
    </CampaignsContext.Provider>
  );
}
