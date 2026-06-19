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
import { RecoveryBackupBanner } from "../components/RecoveryBackupBanner";
import { validateCampaignName } from "../utils/validation";
import { buildRoute } from "../constants/routes";
import {
  createCampaign,
  deleteCampaign,
  updateCampaignName,
} from "../services/campaignService";
import { archiveCampaign, restoreCampaign } from "../utils/campaignActions";
import type { CampaignWithId, CharacterListItem } from "../types/Firestore";
import { uiSection, editableInputClass } from "../ui/editableStyles";
import { Button } from "../ui/Button";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { ConfirmInline } from "../ui/ConfirmInline";
import { ClaimForm } from "./ClaimCharacter/ClaimForm";
import { ClaimPreview } from "./ClaimCharacter/ClaimPreview";
import { useRecoveryLookup } from "./ClaimCharacter/hooks/useRecoveryLookup";
import { useClaimActions } from "./ClaimCharacter/hooks/useClaimActions";

interface Props {
  user: User;
  effectiveUserId: string;
  isLinked: boolean;
  firstName: string | null;
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
          <div className="font-semibold text-slate-200 leading-tight lg:text-lg">{name}</div>
          {(career || rank) && (
            <div className="text-sm lg:text-base text-slate-400">
              {[career, rank].filter(Boolean).join(" · ")}
            </div>
          )}
          {(character.wounds || xpLeft !== null) && (
            <div className="flex flex-wrap gap-3 text-xs lg:text-sm text-slate-400">
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
          <div className="text-xs lg:text-sm text-slate-600 font-code">
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
      <SectionHeader className="mb-3">{campaignName}</SectionHeader>

      {loading && <p className="text-sm lg:text-base text-slate-500">Loading characters…</p>}

      {!loading && characters.length === 0 && (
        <p className="text-sm lg:text-base text-slate-500">No characters claimed in this campaign.</p>
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
  const [deleting, setDeleting] = useState(false);
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
        <SectionHeader className="mb-3">Create Campaign</SectionHeader>
        <div className="flex gap-2">
          <input
            className={editableInputClass(true) + " flex-1"}
            placeholder="Campaign Name"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            aria-label="New campaign name"
          />
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </div>

      {/* Active campaigns */}
      <div>
        <SectionHeader className="mb-3">Your Campaigns</SectionHeader>

        {loading ? (
          <p className="text-slate-400 text-sm lg:text-base">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-400 text-sm lg:text-base">No campaigns created yet.</p>
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
                  <Button size="sm" onClick={handleEditSave}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setEditingId(null); setEditName(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Link
                  key={campaign.id}
                  to={buildRoute.campaignOverview(campaign.id)}
                  className={uiSection + " flex items-center gap-2 hover:bg-slate-800 transition-colors"}
                >
                  <span className="flex-1 font-medium text-slate-200 lg:text-lg">{campaign.name}</span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); setEditingId(campaign.id); setEditName(campaign.name); }}
                  >
                    Edit
                  </Button>

                  <ConfirmInline
                    triggerLabel="Archive"
                    question="Archive?"
                    variant="warning"
                    size="sm"
                    busy={archiving}
                    onConfirm={() => handleArchive(campaign.id)}
                  />

                  <ConfirmInline
                    triggerLabel="Delete"
                    requireText="DELETE"
                    requirePrompt="Type DELETE to confirm"
                    size="sm"
                    busy={deleting}
                    onConfirm={() => handleDeleteConfirm(campaign.id)}
                  />
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
              className="text-sm lg:text-base text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showArchived ? "▾" : "▸"} Archived ({archivedCampaigns.length})
            </button>

            {showArchived && (
              <div className="flex flex-col gap-2 mt-2">
                {archivedCampaigns.map((campaign) => (
                  <div key={campaign.id} className={uiSection + " flex items-center gap-2 opacity-60"}>
                    <span className="flex-1 text-slate-400 italic lg:text-lg">{campaign.name}</span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(campaign.id)}
                      disabled={restoring}
                    >
                      Restore
                    </Button>

                    <ConfirmInline
                      triggerLabel="Delete"
                      requireText="DELETE"
                      requirePrompt="Type DELETE to confirm"
                      size="sm"
                      busy={deleting}
                      onConfirm={() => handleDeleteConfirm(campaign.id)}
                    />
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

// ─── QR code modal ────────────────────────────────────────────────────────────

function QrModal({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 lg:p-6 flex flex-col gap-4 pointer-events-auto max-w-xs lg:max-w-sm w-full mx-4">
          <div className="flex items-center justify-between">
            <span className="text-sm lg:text-base font-semibold text-slate-200">{title}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg lg:text-xl leading-none transition"
            >
              ×
            </button>
          </div>
          <div className="p-3 bg-white rounded-lg flex justify-center">
            <QRCodeSVG value={url} size={220} />
          </div>
          <p className="text-xs lg:text-sm text-slate-500 break-all text-center">{url}</p>
        </div>
      </div>
    </>
  );
}

function QrPanel() {
  const [open, setOpen] = useState<"full" | "player" | null>(null);
  const origin = window.location.origin;
  const fullUrl = `${origin}?invite=full`;
  const playerUrl = `${origin}?invite=player`;

  return (
    <>
      <div>
        <SectionHeader className="mb-3">Share App</SectionHeader>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen("full")}>
            Share full app
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setOpen("player")}>
            Share player invite
          </Button>
        </div>
      </div>

      {open === "full" && (
        <QrModal title="Full App" url={fullUrl} onClose={() => setOpen(null)} />
      )}
      {open === "player" && (
        <QrModal title="Player Invite" url={playerUrl} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

// ─── Claim a character (inline) ───────────────────────────────────────────────

function ClaimCharacterSection({ effectiveUserId }: { effectiveUserId: string }) {
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  const { loading, error, data, lookup } = useRecoveryLookup();
  const { claimCharacter } = useClaimActions();

  const handleLookup = useCallback(() => {
    lookup(code);
  }, [lookup, code]);

  const handleClaim = useCallback(async () => {
    if (!data || claiming) return;
    if (data.ownership !== "unclaimed") {
      setClaimError("This character cannot be claimed.");
      return;
    }
    try {
      setClaiming(true);
      setClaimError(null);
      await claimCharacter(data.campaignId, data.character, effectiveUserId);
      navigate(buildRoute.characterSheet(data.campaignId, data.characterId));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to claim character. It may have been claimed already.";
      toast.error(message);
      setClaimError(message);
    } finally {
      setClaiming(false);
    }
  }, [data, claiming, claimCharacter, navigate, toast, effectiveUserId]);

  return (
    <div>
      <SectionHeader className="mb-3">Claim a Character</SectionHeader>

      <div className="space-y-4">
        <ClaimForm code={code} onCodeChange={setCode} onSubmit={handleLookup} loading={loading} />

        {error && (
          <p className="text-red-400 text-sm lg:text-base border border-red-600 bg-red-900/20 p-2 lg:p-3 rounded">
            {error}
          </p>
        )}

        {claimError && (
          <p className="text-red-400 text-sm lg:text-base border border-red-600 bg-red-900/20 p-2 lg:p-3 rounded">
            {claimError}
          </p>
        )}

        {data && (
          <ClaimPreview
            character={data.character}
            campaign={data.campaign}
            ownership={data.ownership}
            onClaim={handleClaim}
          />
        )}

        {claiming && <p className="text-xs lg:text-sm text-slate-400 text-center">Claiming character…</p>}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ user, effectiveUserId, isLinked, firstName }: Props) {
  const { dmCampaigns, playerCampaigns, loading } = useCampaignsContext();
  const installMode = useInstallMode();

  return (
    <PageShell title={firstName ? `${firstName}'s Dashboard` : "Dashboard"}>
      <RecoveryBackupBanner ownUid={user.uid} effectiveUserId={effectiveUserId} />

      <Panel>

        {/* ── DM section ───────────────────────────────────────────────── */}
        {installMode === "full" && (
          <>
            <DmCampaignList
              userUid={effectiveUserId}
              campaigns={dmCampaigns}
              loading={loading}
            />

            {/* QR codes — only show once the user has at least one campaign */}
            {dmCampaigns.length > 0 && !isLinked && <QrPanel />}

            <hr className="border-slate-700" />
          </>
        )}

        {/* ── Player section ───────────────────────────────────────────── */}
        <SectionHeader>Campaigns You Play In</SectionHeader>

        {loading && <p className="text-slate-400 text-sm lg:text-base">Loading campaigns…</p>}

        {!loading && playerCampaigns.length === 0 && (
          <p className="text-slate-400 text-sm lg:text-base">
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

        <hr className="border-slate-700" />

        {/* ── Claim a character ────────────────────────────────────────── */}
        <ClaimCharacterSection effectiveUserId={effectiveUserId} />

      </Panel>
    </PageShell>
  );
}
