// src/hooks/useCampaigns.ts
// Fetches all campaigns owned by the given DM uid.

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";

type CampaignWithId = CampaignDocument & { id: string };

export function useCampaigns(dmUid: string) {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const snap = await getDocs(collection(db, "campaigns"));
      const list: CampaignWithId[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() as Omit<CampaignDocument, "id">;
        if (data.dmId === dmUid) {
          list.push({ id: docSnap.id, ...data });
        }
      });

      if (!ignore) setCampaigns(list);
    }

    load().catch((err) => console.error("Failed to load campaigns:", err));
    return () => { ignore = true; };
  }, [dmUid]);

  return { campaigns };
}
