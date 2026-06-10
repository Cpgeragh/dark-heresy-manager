// src/pages/DMDashboard.tsx

import type { User } from "firebase/auth";
import { useCampaigns } from "../hooks/useCampaigns";
import { useToast } from "../components/Toast";
import CampaignSection from "./DMDashboard/CampaignSection";

interface Props {
  user: User;
  effectiveUserId: string;
  isLinked: boolean;
  unlink: () => Promise<void>;
}

export default function DMDashboard({ user: _user, effectiveUserId, isLinked, unlink }: Props) {
  const { campaigns, loading } = useCampaigns(effectiveUserId);
  const toast = useToast();

  async function handleUnlink() {
    try {
      await unlink();
    } catch {
      toast.error("Failed to unlink device. Please try again.");
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-semibold text-slate-100 text-center">DM Dashboard</h1>

      {isLinked && (
        <div className="border border-amber-700 bg-amber-900/20 p-4 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-amber-300">This device is linked to another DM's account.</p>
          <button
            onClick={handleUnlink}
            className="shrink-0 px-3 py-1.5 rounded text-sm font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Unlink
          </button>
        </div>
      )}

      <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">
        <CampaignSection
          userUid={effectiveUserId}
          campaigns={campaigns}
          loading={loading}
          isLinked={isLinked}
        />
      </div>
    </div>
  );
}
