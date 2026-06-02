// src/hooks/useCampaignsForUser.ts

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";

type CampaignWithId = CampaignDocument & { id: string };

export function useCampaignsForUser(
  uid: string,
  role: "player" | "dm"
): { campaigns: CampaignWithId[]; loading: boolean; error: string | null } {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    async function load() {
      const field = role === "dm" ? "dmId" : "memberIds";
      const op    = role === "dm" ? "==" : "array-contains";

      const snap = await getDocs(
        query(collection(db, "campaigns"), where(field, op, uid))
      );

      const list: CampaignWithId[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CampaignDocument, "id">),
      }));

      if (!ignore) {
        setCampaigns(list);
        setLoading(false);
      }
    }

    load().catch((err) => {
      console.error("useCampaignsForUser load error:", err);
      if (!ignore) {
        setError("Failed to load campaigns. A Firestore index may be missing — check the console.");
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [uid, role]);

  return { campaigns, loading, error };
}
