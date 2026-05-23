// src/pages/DMDashboard/CampaignSection.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { CampaignDocument } from "../../types/Firestore";
import { validateCampaignName } from "../../utils/validation";
import { useToast } from "../../components/Toast";
import { buildRoute } from "../../constants/routes";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const toast = useToast();

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCampaignName(e.target.value);
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newCampaignName.trim();

    // Validate campaign name
    const validation = validateCampaignName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid campaign name");
      return;
    }

    try {
      const newRef = doc(collection(db, "campaigns"));

      const campaignData: CampaignDocument = {
        name,
        dmId: userUid,
        createdAt: new Date(),
      };

      await setDoc(newRef, campaignData);

      setNewCampaignName("");
      onCampaignSelect(newRef.id);
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign");
    }
  }, [newCampaignName, userUid, onCampaignSelect, toast]);

  const handleCampaignClick = useCallback((campaignId: string) => {
    onCampaignSelect(campaignId);
  }, [onCampaignSelect]);

  const handleEditStart = useCallback((campaign: CampaignWithId) => {
    setEditingId(campaign.id);
    setEditName(campaign.name);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditName("");
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingId) return;
    const name = editName.trim();
    const validation = validateCampaignName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid campaign name");
      return;
    }
    try {
      await updateDoc(doc(db, "campaigns", editingId), { name });
      setEditingId(null);
      setEditName("");
    } catch {
      toast.error("Failed to update campaign name");
    }
  }, [editingId, editName, toast]);

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
                className={`px-4 py-2 border rounded flex items-center gap-2 ${
                  activeCampaignId === campaign.id
                    ? "border-amber-400 bg-amber-500/20"
                    : "border-slate-600 hover:bg-slate-800"
                }`}
              >
                {editingId === campaign.id ? (
                  <>
                    <input
                      className="px-2 py-1 bg-slate-700 border border-slate-500 rounded text-sm flex-1"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      aria-label="Edit campaign name"
                    />
                    <button
                      onClick={handleEditSave}
                      className="text-xs px-2 py-1 bg-amber-500 text-slate-900 rounded font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={() => handleCampaignClick(campaign.id)}
                    >
                      {campaign.name}
                    </span>
                    <Link
                      to={buildRoute.campaignOverview(campaign.id)}
                      className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                      aria-label={`View ${campaign.name}`}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleEditStart(campaign)}
                      className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                      aria-label={`Edit ${campaign.name}`}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignSection;