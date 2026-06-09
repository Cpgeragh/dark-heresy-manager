// src/pages/DMDashboard/CampaignSection.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { CampaignDocument } from "../../types/Firestore";
import { validateCampaignName } from "../../utils/validation";
import { useToast } from "../../components/Toast";
import { buildRoute } from "../../constants/routes";
import { createCampaign, deleteCampaign, updateCampaignName } from "../../services/campaignService";
import { archiveCampaign } from "../../utils/campaignActions";

type CampaignWithId = CampaignDocument & { id: string };

interface CampaignSectionProps {
  userUid: string;
  campaigns: CampaignWithId[];
  loading: boolean;
  activeCampaignId: string | null;
  onCampaignSelect: (campaignId: string | null) => void;
}

function CampaignSection({
  userUid,
  campaigns,
  loading,
  activeCampaignId,
  onCampaignSelect,
}: CampaignSectionProps) {
  const [newCampaignName, setNewCampaignName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const toast = useToast();

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCampaignName(e.target.value);
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newCampaignName.trim();

    const validation = validateCampaignName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid campaign name");
      return;
    }

    try {
      const newId = await createCampaign(name, userUid);
      setNewCampaignName("");
      onCampaignSelect(newId);
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign");
    }
  }, [newCampaignName, userUid, onCampaignSelect, toast]);

  const handleEditStart = useCallback((campaign: CampaignWithId) => {
    setEditingId(campaign.id);
    setEditName(campaign.name);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditName("");
  }, []);

  const handleArchive = useCallback(
    async (campaignId: string) => {
      setArchiving(true);
      try {
        await archiveCampaign(campaignId);
        if (activeCampaignId === campaignId) {
          onCampaignSelect(null);
        }
        setConfirmArchiveId(null);
        toast.success("Campaign archived.");
      } catch (err) {
        console.error("Failed to archive campaign:", err);
        toast.error("Failed to archive campaign. Please try again.");
      } finally {
        setArchiving(false);
      }
    },
    [activeCampaignId, onCampaignSelect, toast]
  );

  const handleDeleteConfirm = useCallback(
    async (campaignId: string) => {
      setDeleting(true);
      try {
        await deleteCampaign(campaignId);
        if (activeCampaignId === campaignId) {
          onCampaignSelect(null);
        }
        setConfirmDeleteId(null);
        setDeleteConfirmText("");
        toast.success("Campaign deleted.");
      } catch (err) {
        console.error("Failed to delete campaign:", err);
        toast.error("Failed to delete campaign. Please try again.");
      } finally {
        setDeleting(false);
      }
    },
    [activeCampaignId, onCampaignSelect, toast]
  );

  const handleEditSave = useCallback(async () => {
    if (!editingId) return;
    const name = editName.trim();
    const validation = validateCampaignName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid campaign name");
      return;
    }
    try {
      await updateCampaignName(editingId, name);
      setEditingId(null);
      setEditName("");
    } catch (err) {
      console.error("Failed to update campaign name:", err);
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

        {loading ? (
          <p className="text-slate-400 text-sm">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
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
                      onClick={() => onCampaignSelect(campaign.id)}
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
                    {/* Archive */}
                    {confirmArchiveId === campaign.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-amber-400">Archive?</span>
                        <button
                          onClick={() => handleArchive(campaign.id)}
                          disabled={archiving}
                          className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-500 disabled:opacity-50"
                        >
                          {archiving ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmArchiveId(null)}
                          disabled={archiving}
                          className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmArchiveId(campaign.id)}
                        className="text-xs px-2 py-1 bg-amber-900/40 text-amber-400 rounded hover:bg-amber-900/70"
                        aria-label={`Archive ${campaign.name}`}
                      >
                        Archive
                      </button>
                    )}

                    {/* Delete — requires typing DELETE to confirm */}
                    {confirmDeleteId === campaign.id ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs text-red-400">Type DELETE to confirm</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            autoFocus
                            disabled={deleting}
                            className="px-2 py-1 bg-slate-700 border border-slate-500 rounded text-xs text-slate-100 w-20 font-mono placeholder:text-slate-600 disabled:opacity-50"
                          />
                          <button
                            onClick={() => handleDeleteConfirm(campaign.id)}
                            disabled={deleting || deleteConfirmText !== "DELETE"}
                            className="text-xs px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            {deleting ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => { setConfirmDeleteId(null); setDeleteConfirmText(""); }}
                            disabled={deleting}
                            className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(campaign.id)}
                        className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded hover:bg-red-900/70"
                        aria-label={`Delete ${campaign.name}`}
                      >
                        Delete
                      </button>
                    )}
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
