// src/pages/Dashboard.tsx
//
// Unified dashboard — shows both sections on one screen:
//   • DM section  (create / manage campaigns, QR codes)
//   • Player section (campaigns you play in, claim character)

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "firebase/auth";
import { useCampaignsContext } from "../context/useCampaignsContext";
import { usePlayerCharacters } from "../hooks/usePlayerCharacters";
import { useArchivedCampaigns } from "../hooks/useArchivedCampaigns";
import { useToast } from "../components/Toast";
import { PortraitUpload } from "../components/PortraitUpload";
import { RecoveryBackupBanner } from "../components/RecoveryBackupBanner";
import { validateCampaignName, validateInquisitorName } from "../utils/validation";
import { buildRoute } from "../constants/routes";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import {
  archiveCampaign,
  createCampaign,
  deleteCampaign,
  preflightCampaignDeletion,
  restoreCampaign,
  updateCampaignDetails,
} from "../services/campaignService";
import type { CampaignWithId, CharacterListItem } from "../types/Firestore";
import { uiSection, editableInputClass, uiTextError } from "../ui/editableStyles";
import { Button } from "../ui/Button";
import { ExpandChevron } from "../ui/ExpandChevron";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { QrModal } from "../ui/QrModal";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";
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

interface DeletePreflightState {
  loading: boolean;
  result?: { jobId: string; totalCount: number };
  error?: string;
}

function deleteImpactDetails(state?: DeletePreflightState) {
  if (!state || state.loading)
    return <span className="text-xs text-slate-500">Checking affected documents…</span>;
  if (state.error) return <span className="text-xs text-red-400">{state.error}</span>;
  if (!state.result) return null;
  return (
    <span className="text-xs text-slate-500">
      {`This permanently deletes ${state.result.totalCount} document${state.result.totalCount === 1 ? "" : "s"}.`}
    </span>
  );
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
                  <span className={xpLeft < 0 ? "text-red-400 font-semibold" : "text-slate-200"}>
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
  characters,
  loading,
  error,
}: {
  campaignId: string;
  campaignName: string;
  characters: CharacterListItem[];
  loading: boolean;
  error: Error | null;
}) {
  return (
    <div>
      <SectionHeader className="mb-3">{campaignName}</SectionHeader>

      {error ? (
        <ErrorState>Unable to load characters. Please refresh the page.</ErrorState>
      ) : loading ? (
        <LoadingState>Loading characters…</LoadingState>
      ) : null}

      {!error && !loading && characters.length === 0 && (
        <p className="text-sm lg:text-base text-slate-500">
          No characters claimed in this campaign.
        </p>
      )}

      {!error && !loading && characters.length > 0 && (
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
  error,
  firstName,
}: {
  userUid: string;
  campaigns: CampaignWithId[];
  loading: boolean;
  error: Error | null;
  firstName: string | null;
}) {
  const {
    campaigns: archivedCampaigns,
    loading: archivedLoading,
    error: archivedError,
  } = useArchivedCampaigns(userUid);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newInquisitorName, setNewInquisitorName] = useState("");
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editInquisitorName, setEditInquisitorName] = useState("");
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<
    { processedCount: number; totalCount: number } | null
  >(null);
  const [deletePreflights, setDeletePreflights] = useState<Record<string, DeletePreflightState>>(
    {}
  );
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const toast = useToast();

  const handleCreate = useCallback(async () => {
    if (creatingRef.current) return;
    const name = newCampaignName.trim();
    const validation = validateCampaignName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid campaign name");
      return;
    }
    const inquisitorName = newInquisitorName.trim();
    if (inquisitorName) {
      const inquisitorValidation = validateInquisitorName(inquisitorName);
      if (!inquisitorValidation.isValid) {
        toast.warning(inquisitorValidation.error ?? "Invalid Inquisitor name");
        return;
      }
    }
    creatingRef.current = true;
    setCreating(true);
    try {
      await createCampaign(name, userUid, firstName ?? undefined, inquisitorName || undefined);
      setNewCampaignName("");
      setNewInquisitorName("");
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [newCampaignName, newInquisitorName, userUid, firstName, toast]);

  const handleEditSave = useCallback(async () => {
    if (!editingId || editingRef.current) return;
    const name = editName.trim();
    const validation = validateCampaignName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid campaign name");
      return;
    }
    const inquisitorName = editInquisitorName.trim();
    if (inquisitorName) {
      const inquisitorValidation = validateInquisitorName(inquisitorName);
      if (!inquisitorValidation.isValid) {
        toast.warning(inquisitorValidation.error ?? "Invalid Inquisitor name");
        return;
      }
    }
    editingRef.current = true;
    setEditing(true);
    try {
      await updateCampaignDetails(editingId, name, inquisitorName);
      setEditingId(null);
      setEditName("");
      setEditInquisitorName("");
    } catch (err) {
      console.error("Failed to update campaign:", err);
      toast.error("Failed to update campaign");
    } finally {
      editingRef.current = false;
      setEditing(false);
    }
  }, [editingId, editName, editInquisitorName, toast]);

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
      const jobId = deletePreflights[campaignId]?.result?.jobId;
      if (!jobId) return;
      setDeleting(true);
      setDeleteProgress(null);
      try {
        await deleteCampaign(jobId, setDeleteProgress);
        toast.success("Campaign deleted.");
      } catch (err) {
        console.error("Failed to delete campaign:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete campaign. Please try again."
        );
      } finally {
        setDeleting(false);
        setDeleteProgress(null);
      }
    },
    [deletePreflights, toast]
  );

  const loadDeletePreflight = useCallback(async (campaignId: string) => {
    setDeletePreflights((current) => ({
      ...current,
      [campaignId]: { loading: true },
    }));
    try {
      const result = await preflightCampaignDeletion(campaignId);
      setDeletePreflights((current) => ({
        ...current,
        [campaignId]: { loading: false, result },
      }));
    } catch (error) {
      setDeletePreflights((current) => ({
        ...current,
        [campaignId]: {
          loading: false,
          error: error instanceof Error ? error.message : "Unable to check this deletion.",
        },
      }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Create */}
      <div>
        <SectionHeader className="mb-3">Create Campaign</SectionHeader>
        <div className="space-y-2">
          <input
            className={editableInputClass(true)}
            placeholder="Inquisitor Name (optional)"
            value={newInquisitorName}
            maxLength={PRODUCT_LIMITS.inquisitorNameCharacters}
            onChange={(e) => setNewInquisitorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
            aria-label="Inquisitor name"
          />
          <input
            className={editableInputClass(true)}
            placeholder="Campaign Name"
            value={newCampaignName}
            maxLength={PRODUCT_LIMITS.campaignNameCharacters}
            onChange={(e) => setNewCampaignName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
            aria-label="New campaign name"
          />
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>

      {/* Active campaigns */}
      <div>
        <SectionHeader className="mb-3">Your Campaigns</SectionHeader>

        {error ? (
          <ErrorState>Unable to load campaigns. Please refresh the page.</ErrorState>
        ) : loading ? (
          <LoadingState>Loading campaigns…</LoadingState>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-400 text-sm lg:text-base">No campaigns created yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((campaign) =>
              editingId === campaign.id ? (
                <div key={campaign.id} className={uiSection + " space-y-2"}>
                  <input
                    className={editableInputClass(true)}
                    value={editInquisitorName}
                    maxLength={PRODUCT_LIMITS.inquisitorNameCharacters}
                    onChange={(e) => setEditInquisitorName(e.target.value)}
                    placeholder="Inquisitor Name (optional)"
                    aria-label="Edit Inquisitor name"
                  />
                  <input
                    className={editableInputClass(true)}
                    value={editName}
                    maxLength={PRODUCT_LIMITS.campaignNameCharacters}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    aria-label="Edit campaign name"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleEditSave} disabled={editing}>
                      {editing ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={editing}
                      onClick={() => {
                        setEditingId(null);
                        setEditName("");
                        setEditInquisitorName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Link
                  key={campaign.id}
                  to={buildRoute.campaignOverview(campaign.id)}
                  className={
                    uiSection + " flex items-center gap-2 hover:bg-slate-800 transition-colors"
                  }
                >
                  <span className="flex-1 font-medium text-slate-200 lg:text-lg">
                    {campaign.name}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingId(campaign.id);
                      setEditName(campaign.name);
                      setEditInquisitorName(campaign.inquisitorName ?? "");
                    }}
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
                    onArm={() => loadDeletePreflight(campaign.id)}
                    details={deleteImpactDetails(deletePreflights[campaign.id])}
                    confirmDisabled={
                      deletePreflights[campaign.id]?.loading || !deletePreflights[campaign.id]?.result
                    }
                    onConfirm={() => handleDeleteConfirm(campaign.id)}
                    busyLabel={
                      deleteProgress && deleteProgress.totalCount > 0
                        ? `Deleting… (${deleteProgress.processedCount}/${deleteProgress.totalCount})`
                        : "Deleting…"
                    }
                  />
                </Link>
              )
            )}
          </div>
        )}

        {/* Archived */}
        {archivedError ? (
          <ErrorState className="mt-4">Unable to load archived campaigns.</ErrorState>
        ) : archivedLoading ? (
          <LoadingState className="mt-4">Loading archived campaigns…</LoadingState>
        ) : archivedCampaigns.length === 0 ? (
          <p className="mt-4 text-slate-500 text-sm lg:text-base">No archived campaigns.</p>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              aria-expanded={showArchived}
              className="inline-flex items-center gap-1 text-sm lg:text-base text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ExpandChevron expanded={showArchived} />
              <span>Archived ({archivedCampaigns.length})</span>
            </button>

            {showArchived && (
              <div className="flex flex-col gap-2 mt-2">
                {archivedCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={uiSection + " flex items-center gap-2 opacity-60"}
                  >
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
                      onArm={() => loadDeletePreflight(campaign.id)}
                      details={deleteImpactDetails(deletePreflights[campaign.id])}
                      confirmDisabled={
                        deletePreflights[campaign.id]?.loading || !deletePreflights[campaign.id]?.result
                      }
                      onConfirm={() => handleDeleteConfirm(campaign.id)}
                      busyLabel={
                        deleteProgress && deleteProgress.totalCount > 0
                          ? `Deleting… (${deleteProgress.processedCount}/${deleteProgress.totalCount})`
                          : "Deleting…"
                      }
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

// ─── QR code panel ────────────────────────────────────────────────────────────

function QrPanel() {
  const [open, setOpen] = useState(false);
  const url = window.location.origin;

  return (
    <>
      <div>
        <SectionHeader className="mb-3">Share App</SectionHeader>
        <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
          Share App
        </Button>
      </div>

      {open && <QrModal title="Share App" url={url} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── Claim a character (inline) ───────────────────────────────────────────────

function ClaimCharacterSection() {
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  const { loading, error, data, lookup } = useRecoveryLookup();
  const { claimCharacter } = useClaimActions();

  useEffect(() => {
    const codeParam = new URLSearchParams(window.location.search).get("code");
    if (codeParam) {
      setCode(codeParam);
      lookup(codeParam);
    }
  }, [lookup]);

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
      const result = await claimCharacter(code);
      navigate(buildRoute.characterSheet(result.campaignId, result.characterId));
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
  }, [data, claiming, claimCharacter, navigate, toast, code]);

  return (
    <div>
      <SectionHeader className="mb-3">Claim a Character</SectionHeader>

      <div className="space-y-4">
        <ClaimForm code={code} onCodeChange={setCode} onSubmit={handleLookup} loading={loading} />

        {error && (
          <p className={`${uiTextError} border border-red-600 bg-red-900/20 p-2 lg:p-3 rounded`}>
            {error}
          </p>
        )}

        {claimError && (
          <p className={`${uiTextError} border border-red-600 bg-red-900/20 p-2 lg:p-3 rounded`}>
            {claimError}
          </p>
        )}

        {data && (
          <ClaimPreview
            characterName={data.characterName}
            campaignName={data.campaignName}
            ownership={data.ownership}
            onClaim={handleClaim}
          />
        )}

        {claiming && (
          <p className="text-xs lg:text-sm text-slate-400 text-center">Claiming character…</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ user, effectiveUserId, isLinked, firstName }: Props) {
  const { dmCampaigns, playerCampaigns, dmLoading, playerLoading, dmError, playerError } =
    useCampaignsContext();
  const {
    characters: playerCharacters,
    loading: playerCharactersLoading,
    error: playerCharactersError,
  } = usePlayerCharacters(effectiveUserId);

  return (
    <PageShell title={firstName ? `${firstName}'s Dashboard` : "Dashboard"}>
      <RecoveryBackupBanner ownUid={user.uid} effectiveUserId={effectiveUserId} />

      <Panel>
        {/* ── DM section ───────────────────────────────────────────────── */}
        <DmCampaignList
          userUid={effectiveUserId}
          campaigns={dmCampaigns}
          loading={dmLoading}
          error={dmError}
          firstName={firstName}
        />

        {/* QR codes — only show once the user has at least one campaign */}
        {dmCampaigns.length > 0 && !isLinked && <QrPanel />}

        <hr className="border-slate-700" />

        {/* ── Player section ───────────────────────────────────────────── */}
        <SectionHeader>Campaigns You Play In</SectionHeader>

        {playerError ? (
          <ErrorState>Unable to load campaigns. Please refresh the page.</ErrorState>
        ) : playerLoading ? (
          <LoadingState>Loading campaigns…</LoadingState>
        ) : null}

        {!playerError && !playerLoading && playerCampaigns.length === 0 && (
          <p className="text-slate-400 text-sm lg:text-base">
            You are not part of any campaigns yet. Ask your DM for a recovery code to claim your
            character.
          </p>
        )}

        {!playerError && !playerLoading && playerCampaigns.length > 0 && (
          <div className="space-y-4">
            {playerCampaigns.map((campaign) => (
              <PlayerCampaignRow
                key={campaign.id}
                campaignId={campaign.id}
                campaignName={campaign.name}
                characters={playerCharacters.filter(
                  (character) => character.campaignId === campaign.id
                )}
                loading={playerCharactersLoading}
                error={playerCharactersError}
              />
            ))}
          </div>
        )}

        <hr className="border-slate-700" />

        {/* ── Claim a character ────────────────────────────────────────── */}
        <ClaimCharacterSection />
      </Panel>
    </PageShell>
  );
}
