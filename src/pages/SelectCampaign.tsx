// src/pages/SelectCampaign.tsx

import { useEffect, useState, useCallback } from "react";
import { collection, collectionGroup, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";
import { useIsMounted } from "../hooks/useIsMounted";

type CampaignWithId = CampaignDocument & { id: string };

type Props = {
  user: User;
  role: "player" | "dm";
  activeCampaignId: string | null;
  onActiveCampaignChange: (id: string | null) => void;
};

export default function SelectCampaign({
  user,
  role,
  activeCampaignId,
  onActiveCampaignChange,
}: Props) {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useIsMounted();

  const handleCampaignSelect = useCallback((campaignId: string) => {
    onActiveCampaignChange(campaignId);
  }, [onActiveCampaignChange]);

  useEffect(() => {
    async function load() {
      if (role === "dm") {
        const snap = await getDocs(
          query(collection(db, "campaigns"), where("dmId", "==", user.uid))
        );
        const list: CampaignWithId[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CampaignDocument, "id">),
        }));
        if (isMounted()) setCampaigns(list);
      } else {
        const charSnap = await getDocs(
          query(collectionGroup(db, "characters"), where("userId", "==", user.uid))
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
        if (isMounted()) setCampaigns(list);
      }
    }

    load().catch((err) => {
      console.error("SelectCampaign load error:", err);
      if (isMounted()) setError("Failed to load campaigns. A Firestore index may be missing — check the console.");
    });
  }, [user.uid, role, isMounted]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Select Campaign</h2>

      {error && (
        <p className="text-red-400 text-sm border border-red-700 bg-red-900/20 rounded p-2">
          {error}
        </p>
      )}

      {!error && campaigns.length === 0 && (
        <p className="text-slate-400">
          {role === "dm"
            ? "You have no campaigns yet. Create one from the dashboard."
            : "You have no claimed characters in any campaign."}
        </p>
      )}

      <div className="grid gap-3">
        {campaigns.map((c) => {
          const isActive = activeCampaignId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => handleCampaignSelect(c.id)}
              className={`px-4 py-2 rounded border text-left transition
                ${isActive
                  ? "bg-amber-500 text-slate-900 border-amber-400"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
            >
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-slate-400">
                DM: {c.dmId.slice(0, 8)}…
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}