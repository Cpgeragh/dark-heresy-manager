// src/pages/DMDashboard.tsx

import type { User } from "firebase/auth";
import { useCampaigns } from "../hooks/useCampaigns";
import CampaignSection from "./DMDashboard/CampaignSection";

interface Props {
  user: User;
}

export default function DMDashboard({ user }: Props) {
  const { campaigns, loading } = useCampaigns(user.uid);

  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-semibold text-slate-100 text-center">DM Dashboard</h1>

      <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">
        <CampaignSection
          userUid={user.uid}
          campaigns={campaigns}
          loading={loading}
        />
      </div>
    </div>
  );
}
