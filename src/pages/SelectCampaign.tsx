// src/pages/SelectCampaign.tsx

import { useCallback } from "react";
import type { User } from "firebase/auth";
import { useCampaignsForUser } from "../hooks/useCampaignsForUser";

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
  const { campaigns, error } = useCampaignsForUser(user.uid, role);

  const handleCampaignSelect = useCallback((campaignId: string) => {
    onActiveCampaignChange(campaignId);
  }, [onActiveCampaignChange]);

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
