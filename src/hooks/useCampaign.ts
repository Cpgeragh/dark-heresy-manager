// src/hooks/useCampaign.ts
// Real-time listener for a single campaign document.

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { campaignDocRef } from "../firebase/converters";
import type { CampaignWithId } from "../types/Firestore";

export function useCampaign(campaignId: string | null) {
  const [campaign, setCampaign] = useState<CampaignWithId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      campaignDocRef(campaignId),
      (snap) => {
        setCampaign(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error("useCampaign error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [campaignId]);

  return { campaign, loading };
}
