// src/pages/DMDashboard.tsx

import type { User } from "firebase/auth";
import { useCampaigns } from "../hooks/useCampaigns";
import { useCampaignCharacters } from "../hooks/useCampaignCharacters";
import CampaignSection from "./DMDashboard/CampaignSection";
import CharacterSection from "./DMDashboard/CharacterSection";

interface Props {
  user: User;
  activeCampaignId: string | null;
  onActiveCampaignChange: (id: string | null) => void;
}

export default function DMDashboard({
  user,
  activeCampaignId,
  onActiveCampaignChange,
}: Props) {
  const { campaigns } = useCampaigns(user.uid);
  const { characters } = useCampaignCharacters(activeCampaignId);

  return (
    <div className="text-slate-100">
      <h1 className="text-4xl font-bold mb-6">DM Dashboard</h1>

      <CampaignSection
        userUid={user.uid}
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        onCampaignSelect={onActiveCampaignChange}
      />

      {activeCampaignId && (
        <div className="mt-10">
          <CharacterSection
            campaignId={activeCampaignId}
            characters={characters}
          />
        </div>
      )}
    </div>
  );
}