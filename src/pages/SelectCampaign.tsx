// src/pages/SelectCampaign.tsx

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";

type CampaignWithId = CampaignDocument & { id: string };

type Props = {
  user: User;
  role: "player" | "dm";
  activeCampaignId: string | null;
  onActiveCampaignChange: (id: string | null) => void;
};

export default function SelectCampaign({
  user: _user,
  role: _role,
  activeCampaignId,
  onActiveCampaignChange,
}: Props) {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);

  const handleCampaignSelect = useCallback((campaignId: string) => {
    onActiveCampaignChange(campaignId);
  }, [onActiveCampaignChange]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const snap = await getDocs(collection(db, "campaigns"));
      const list: CampaignWithId[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<CampaignDocument, 'id'>;
        return {
          id: docSnap.id,
          ...data,
        };
      });

      if (isMounted) {
        setCampaigns(list);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Select Campaign</h2>

      {campaigns.length === 0 && (
        <p className="text-slate-400">No campaigns exist yet.</p>
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