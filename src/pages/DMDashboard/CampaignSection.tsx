// src/pages/DMDashboard/CampaignSection.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { CampaignDocument } from "../../types/Firestore";
import { validateCampaignName } from "../../utils/validation";
import { useToast } from "../../components/Toast";
import { buildRoute } from "../../constants/routes";
import { createCampaign, deleteCampaign, updateCampaignName } from "../../services/campaignService";
import { archiveCampaign, restoreCampaign } from "../../utils/campaignActions";
import { useArchivedCampaigns } from "../../hooks/useArchivedCampaigns";
import { uiSection, uiSectionHeader, editableInputClass } from "../../ui/editableStyles";

type CampaignWithId = CampaignDocument & { id: string };

interface CampaignSectionProps {
  userUid: string;
  campaigns: CampaignWithId[];
  loading: boolean;
}

function CampaignSection({ userUid, campaigns, loading }: CampaignSectionProps) {
  const { campaigns: archivedCampaigns } = useArchivedCampaigns(userUid);

  const [newCampaignName, setNewCampaignName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
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
      await createCampaign(name, userUid);
      setNewCampaignName("");
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign");
    }
  }, [newCampaignName, userUid, toast]);

  const handleEditStart = useCallback((campaign: CampaignWithId) => {
    setEditingId(campaign.id);
    setEditName(campaign.name);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditName("");
  }, []);

  const handleArchive = useCallback(async (campaignId: string) => {
    setArchiving(true);
    try {
      await archiveCampaign(campaignId);
      setConfirmArchiveId(null);
      toast.success("Campaign archived.");
    } catch (err) {
      console.error("Failed to archive campaign:", err);
      toast.error("Failed to archive campaign. Please try again.");
    } finally {
      setArchiving(false);
    }
  }, [toast]);

  const handleRestore = useCallback(async (campaignId: string) => {
    setRestoring(true);
    try {
      await restoreCampaign(campaignId);
      toast.success("Campaign restored.");
    } catch (err) {
      console.error("Failed to restore campaign:", err);
      toast.error("Failed to restore campaign. Please try again.");
    } finally {
      setRestoring(false);
    }
  }, [toast]);

  const handleDeleteConfirm = useCallback(async (campaignId: string) => {
    setDeleting(true);
    try {
      await deleteCampaign(campaignId);
      setConfirmDeleteId(null);
      setDeleteConfirmText("");
      toast.success("Campaign deleted.");
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      toast.error("Failed to delete campaign. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [toast]);

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
    <div className="space-y-6">
      {/* CREATE CAMPAIGN */}
      <div>
        <p className={`${uiSectionHeader} mb-3`}>Create Campaign</p>
        <div className="flex gap-2">
          <input
            id="campaign-name-input"
            className={editableInputClass(true) + " flex-1"}
            placeholder="Campaign Name"
            value={newCampaignName}
            onChange={handleNameChange}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            aria-label="New campaign name"
          />
          <button
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm hover:bg-amber-400 transition"
            onClick={handleCreate}
            aria-label="Create new campaign"
          >
            Create
          </button>
        </div>
      </div>

      {/* YOUR CAMPAIGNS */}
      <div>
        <p className={`${uiSectionHeader} mb-3`}>Your Campaigns</p>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-400 text-sm">No campaigns created yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((campaign) => (
              editingId === campaign.id ? (
                <div
                  key={campaign.id}
                  className={uiSection + " flex items-center gap-2"}
                >
                  <input
                    className={editableInputClass(true) + " flex-1"}
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
                </div>
              ) : (
                <Link
                  key={campaign.id}
                  to={buildRoute.campaignOverview(campaign.id)}
                  className={uiSection + " flex items-center gap-2 hover:bg-slate-800 transition-colors"}
                >
                  <span className="flex-1 font-medium">{campaign.name}</span>

                  <button
                    onClick={(e) => { e.preventDefault(); handleEditStart(campaign); }}
                    className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                    aria-label={`Edit ${campaign.name}`}
                  >
                    Edit
                  </button>

                  {/* Archive */}
                  {confirmArchiveId === campaign.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                      <span className="text-xs text-amber-400">Archive?</span>
                      <button
                        onClick={(e) => { e.preventDefault(); void handleArchive(campaign.id); }}
                        disabled={archiving}
                        className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-500 disabled:opacity-50"
                      >
                        {archiving ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); setConfirmArchiveId(null); }}
                        disabled={archiving}
                        className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmArchiveId(campaign.id); }}
                      className="text-xs px-2 py-1 bg-amber-900/40 text-amber-400 rounded hover:bg-amber-900/70"
                      aria-label={`Archive ${campaign.name}`}
                    >
                      Archive
                    </button>
                  )}

                  {/* Delete */}
                  {confirmDeleteId === campaign.id ? (
                    <div className="flex flex-col gap-1 items-start" onClick={(e) => e.preventDefault()}>
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
                          onClick={(e) => { e.preventDefault(); void handleDeleteConfirm(campaign.id); }}
                          disabled={deleting || deleteConfirmText !== "DELETE"}
                          className="text-xs px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {deleting ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); setConfirmDeleteId(null); setDeleteConfirmText(""); }}
                          disabled={deleting}
                          className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmDeleteId(campaign.id); }}
                      className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded hover:bg-red-900/70"
                      aria-label={`Delete ${campaign.name}`}
                    >
                      Delete
                    </button>
                  )}
                </Link>
              )
            ))}
          </div>
        )}

        {/* ARCHIVED CAMPAIGNS */}
        {archivedCampaigns.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showArchived ? "▾" : "▸"} Archived ({archivedCampaigns.length})
            </button>

            {showArchived && (
              <div className="flex flex-col gap-2 mt-2">
                {archivedCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={uiSection + " flex items-center gap-2 opacity-60"}
                  >
                    <span className="flex-1 text-slate-400 italic">{campaign.name}</span>

                    <button
                      onClick={() => handleRestore(campaign.id)}
                      disabled={restoring}
                      className="text-xs px-2 py-1 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50"
                      aria-label={`Restore ${campaign.name}`}
                    >
                      Restore
                    </button>

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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignSection;

