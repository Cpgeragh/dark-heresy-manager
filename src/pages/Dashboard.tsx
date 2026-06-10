// src/pages/Dashboard.tsx
//
// Unified dashboard — shows both sections on one screen:
//   • DM section  (create / manage campaigns, QR codes) — hidden when installMode is "player"
//   • Player section (campaigns you play in, claim character)
//
// installMode is set permanently in localStorage the first time the app is
// opened with ?invite=player in the URL. Player-only installs never see the
// DM section and can never become a DM.

import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import type { User } from "firebase/auth";
import { useCampaignsContext } from "../context/CampaignsContext";
import { useInstallMode } from "../hooks/useInstallMode";
import { usePlayerCharacters } from "../hooks/usePlayerCharacters";
import { useArchivedCampaigns } from "../hooks/useArchivedCampaigns";
import { useToast } from "../components/Toast";
import { PortraitUpload } from "../components/PortraitUpload";
import { validateCampaignName } from "../utils/validation";
import { buildRoute, ROUTES } from "../constants/routes";
import {
  createCampaign,
  deleteCampaign,
  updateCampaignName,
} from "../services/campaignService";
import { archiveCampaign, restoreCampaign } from "../utils/campaignActions";
import type { CampaignWithId, CharacterListItem } from "../types/Firestore";
import { uiSection, uiSectionHeader, editableInputClass } from "../ui/editableStyles";

interface Props {
  user: User;
  effectiveUserId: string;
  isLinked: boolean;
  unlink: () => Promise<void>;
}

// ─── Player character card ────────────────────────────────────────────────────

function CharacterCard({
  character,
  campaignId,
}: {
  character: CharacterListItem;
  campaignId: string;
}) {
  const name = character.header?.characterName ?? "Unnamed Character";
  const career = character.header?.career;
  const rank = character.header?.rank;
  const xpLeft = character.experience
    ? character.experience.total - character.experience.spent
    : null;

  return (
    <Link
      to={buildRoute.characterSheet(campaignId, character.id)}
      className="border border-slate-700 rounded-lg p-4 bg-slate-900/60 block hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div onClick={(e) => e.stopPropagation()}>
          <PortraitUpload
            campaignId={campaignId}
            characterId={character.id}
            currentPortraitUrl={character.portraitUrl}
            canEdit={true}
          />
        </div>
        <div className="flex-1 space-y-1">
          <div className="font-semibold text-slate-100 leading-tight">{name}</div>
          {(career || rank) && (
            <div className="text-sm text-slate-400">
              {[career, rank].filter(Boolean).join(" · ")}
            </div>
          )}
          {(character.wounds || xpLeft !== null) && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              {character.wounds && (
                <span>
                  ❤{" "}
                  <span
                    className={
                      character.wounds.current <= 2
                        ? "text-red-400 font-semibold"
                        : "text-slate-200"
                    }
                  >
                    {character.wounds.current}
                  </span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-slate-200">{character.wounds.total}</span> Wounds
                </span>
              )}
              {xpLeft !== null && (
                <span>
                  ✦{" "}
                  <span
                    className={xpLeft < 0 ? "text-red-400 font-semibold" : "text-slate-200"}
                  >
                    {xpLeft}
                  </span>{" "}
                  XP remaining
                </span>
              )}
            </div>
          )}
          <div className="text-xs text-slate-600 font-mono">
            Recovery: {character.recoveryCode}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Player campaign row ──────────────────────────────────────────────────────

function PlayerCampaignRow({
  campaignId,
  campaignName,
  userId,
}: {
  campaignId: string;
  campaignName: string;
  userId: string;
}) {
  const { characters, loading } = usePlayerCharacters(campaignId, userId);

  return (
    <div>
      <p className={`${uiSectionHeader} mb-3`}>{campaignName}</p>

      {loading && <p className="text-sm text-slate-500">Loading characters…</p>}

      {!loading && characters.length === 0 && (
        <p className="text-sm text-slate-500">No characters claimed in this campaign.</p>
      )}

      {!loading && characters.length > 0 && (
        <div className="space-y-3">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} campaignId={campaignId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DM campaign list (create / edit / archive / delete) ─────────────────────

function DmCampaignList({
  userUid,
  campaigns,
  loading,
}: {
  userUid: string;
  campaigns: CampaignWithId[];
  loading: boolean;
}) {
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

  const handleArchive = useCallback(
    async (campaignId: string) => {
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
    },
    [toast]
  );

  const handleRestore = useCallback(
    async (campaignId: string) => {
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
    },
    [toast]
  );

  const handleDeleteConfirm = useCallback(
    async (campaignId: string) => {
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
    },
    [toast]
  );

  return (
    <div className="space-y-6">
      {/* Create */}
      <div>
        <p className={`${uiSectionHeader} mb-3`}>Create Campaign</p>
        <div className="flex gap-2">
          <input
            className={editableInputClass(true) + " flex-1"}
            placeholder="Campaign Name"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            aria-label="New campaign name"
          />
          <button
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm hover:bg-amber-400 transition"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </div>

      {/* Active campaigns */}
      <div>
        <p className={`${uiSectionHeader} mb-3`}>Your Campaigns</p>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-400 text-sm">No campaigns created yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((campaign) =>
              editingId === campaign.id ? (
                <div key={campaign.id} className={uiSection + " flex items-center gap-2"}>
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
                    onClick={() => { setEditingId(null); setEditName(""); }}
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
                    onClick={(e) => { e.preventDefault(); setEditingId(campaign.id); setEditName(campaign.name); }}
                    className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                  >
                    Edit
                  </button>

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
                        className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmArchiveId(campaign.id); }}
                      className="text-xs px-2 py-1 bg-amber-900/40 text-amber-400 rounded hover:bg-amber-900/70"
                    >
                      Archive
                    </button>
                  )}

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
                    >
                      Delete
                    </button>
                  )}
                </Link>
              )
            )}
          </div>
        )}

        {/* Archived */}
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
                  <div key={campaign.id} className={uiSection + " flex items-center gap-2 opacity-60"}>
                    <span className="flex-1 text-slate-400 italic">{campaign.name}</span>

                    <button
                      onClick={() => handleRestore(campaign.id)}
                      disabled={restoring}
                      className="text-xs px-2 py-1 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50"
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
                            onClick={() => void handleDeleteConfirm(campaign.id)}
                            disabled={deleting || deleteConfirmText !== "DELETE"}
                            className="text-xs px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            {deleting ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => { setConfirmDeleteId(null); setDeleteConfirmText(""); }}
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

// ─── QR code panel ────────────────────────────────────────────────────────────

function QrPanel() {
  const [open, setOpen] = useState(false);
  const fullUrl = window.location.origin;
  const playerUrl = `${fullUrl}?invite=player`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 px-4 border border-slate-600 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition text-left"
      >
        Share app invite links →
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-5 pointer-events-auto max-w-sm w-full mx-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Share App</span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none transition"
                >
                  ×
                </button>
              </div>

              {/* Full app */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  Full app (DM + player)
                </p>
                <div className="p-3 bg-white rounded-lg flex justify-center">
                  <QRCodeSVG value={fullUrl} size={180} />
                </div>
                <p className="text-xs text-slate-500 break-all">{fullUrl}</p>
              </div>

              {/* Player-only */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  Player-only install
                </p>
                <div className="p-3 bg-white rounded-lg flex justify-center">
                  <QRCodeSVG value={playerUrl} size={180} />
                </div>
                <p className="text-xs text-slate-500 break-all">{playerUrl}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ user: _user, effectiveUserId, isLinked, unlink }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { dmCampaigns, playerCampaigns, loading } = useCampaignsContext();
  const installMode = useInstallMode();

  async function handleUnlink() {
    try {
      await unlink();
    } catch {
      toast.error("Failed to unlink device. Please try again.");
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-semibold text-slate-100 text-center">Dashboard</h1>

      {/* Linked-device banner */}
      {isLinked && (
        <div className="border border-amber-700 bg-amber-900/20 p-4 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-amber-300">This device is linked to another account.</p>
          <button
            onClick={handleUnlink}
            className="shrink-0 px-3 py-1.5 rounded text-sm font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Unlink
          </button>
        </div>
      )}

      {/* ── DM section ─────────────────────────────────────────────────── */}
      {installMode === "full" && (
        <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">
          <DmCampaignList
            userUid={effectiveUserId}
            campaigns={dmCampaigns}
            loading={loading}
          />

          {/* QR codes — only show once the user has at least one campaign */}
          {dmCampaigns.length > 0 && !isLinked && <QrPanel />}
        </div>
      )}

      {/* ── Player section ─────────────────────────────────────────────── */}
      <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">
        <p className={`${uiSectionHeader}`}>Campaigns You Play In</p>

        {loading && <p className="text-slate-400 text-sm">Loading campaigns…</p>}

        {!loading && playerCampaigns.length === 0 && (
          <p className="text-slate-400 text-sm">
            You are not part of any campaigns yet. Ask your DM for a recovery code to claim
            your character.
          </p>
        )}

        {!loading && playerCampaigns.length > 0 && (
          <div className="space-y-4">
            {playerCampaigns.map((campaign) => (
              <PlayerCampaignRow
                key={campaign.id}
                campaignId={campaign.id}
                campaignName={campaign.name}
                userId={effectiveUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Claim character FAB */}
      <button
        onClick={() => navigate(ROUTES.CLAIM_CHARACTER)}
        aria-label="Claim a Character"
        className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-amber-500 text-slate-900 shadow-lg hover:bg-amber-400 transition flex items-center justify-center z-30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
