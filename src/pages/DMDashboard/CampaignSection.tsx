// src/pages/DMDashboard/CampaignSection.tsx

import { useState, useCallback } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { CampaignDocument } from "../../types/Firestore";

type CampaignWithId = CampaignDocument & { id: string };

interface CampaignSectionProps {
  userUid: string;
  campaigns: CampaignWithId[];
  activeCampaignId: string | null;
  onCampaignSelect: (campaignId: string) => void;
}

function CampaignSection({
  userUid,
  campaigns,
  activeCampaignId,
  onCampaignSelect,
}: CampaignSectionProps) {
  const [newCampaignName, setNewCampaignName] = useState("");

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCampaignName(e.target.value);
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newCampaignName.trim() || "Untitled campaign";
    const newRef = doc(collection(db, "campaigns"));

    const campaignData: CampaignDocument = {
      name,
      dmId: userUid,
      createdAt: new Date(),
    };

    await setDoc(newRef, campaignData);

    setNewCampaignName("");
    onCampaignSelect(newRef.id);
  }, [newCampaignName, userUid, onCampaignSelect]);

  const handleCampaignClick = useCallback((campaignId: string) => {
    onCampaignSelect(campaignId);
  }, [onCampaignSelect]);

  return (
    <div className="space-y-10">
      {/* CREATE CAMPAIGN */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Create Campaign</h2>

        <div className="flex gap-2">
          <input
            id="campaign-name-input"
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-64"
            placeholder="Campaign Name"
            value={newCampaignName}
            onChange={handleNameChange}
            aria-label="New campaign name"
          />
          <button
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded"
            onClick={handleCreate}
            aria-label="Create new campaign"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* SELECT CAMPAIGN */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Your Campaigns</h2>

        {campaigns.length === 0 ? (
          <p className="text-slate-400">No campaigns created yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`px-4 py-2 border rounded cursor-pointer ${
                  activeCampaignId === campaign.id
                    ? "border-amber-400 bg-amber-500/20"
                    : "border-slate-600 hover:bg-slate-800"
                }`}
                onClick={() => handleCampaignClick(campaign.id)}
              >
                {campaign.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignSection;