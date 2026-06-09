// src/hooks/useArchivedCampaigns.ts
// Real-time listener for a DM's archived campaigns (archivedAt != null).

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { campaignsCollectionRef } from "../firebase/converters";
import type { CampaignWithId } from "../types/Firestore";

export function useArchivedCampaigns(uid: string) {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        campaignsCollectionRef(),
        where("dmId", "==", uid),
        where("archivedAt", "!=", null)
      ),
      (snap) => {
        setCampaigns(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        console.error("useArchivedCampaigns error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  return { campaigns, loading };
}
