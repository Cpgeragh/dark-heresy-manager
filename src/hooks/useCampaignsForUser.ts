// src/hooks/useCampaignsForUser.ts

import { useEffect, useState } from "react";
import { collection, collectionGroup, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";

type CampaignWithId = CampaignDocument & { id: string };

export function useCampaignsForUser(
  uid: string,
  role: "player" | "dm"
): { campaigns: CampaignWithId[]; error: string | null } {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (role === "dm") {
        const snap = await getDocs(
          query(collection(db, "campaigns"), where("dmId", "==", uid))
        );
        const list: CampaignWithId[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CampaignDocument, "id">),
        }));
        if (!ignore) setCampaigns(list);
      } else {
        const charSnap = await getDocs(
          query(collectionGroup(db, "characters"), where("userId", "==", uid))
        );
        const campaignIds = [
          ...new Set(charSnap.docs.map((d) => d.ref.parent.parent!.id)),
        ];
        const campaignDocs = await Promise.all(
          campaignIds.map((id) => getDoc(doc(db, "campaigns", id)))
        );
        const list: CampaignWithId[] = campaignDocs
          .filter((d) => d.exists())
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CampaignDocument, "id">) }));
        if (!ignore) setCampaigns(list);
      }
    }

    load().catch((err) => {
      console.error("useCampaignsForUser load error:", err);
      if (!ignore)
        setError("Failed to load campaigns. A Firestore index may be missing — check the console.");
    });

    return () => {
      ignore = true;
    };
  }, [uid, role]);

  return { campaigns, error };
}
