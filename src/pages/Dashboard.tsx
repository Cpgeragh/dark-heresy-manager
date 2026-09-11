// src/pages/Dashboard.tsx
//
// Unified dashboard — shows both sections on one screen:
//   • DM section  (create / manage campaigns, QR codes)
//   • Player section (campaigns you play in, claim character)

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import { useCampaignsContext } from "../context/useCampaignsContext";
import { useArchivedCampaigns } from "../hooks/useArchivedCampaigns";
import { useToast } from "../components/Toast";
import { RecoveryBackupBanner } from "../components/RecoveryBackupBanner";
import {
  validateCampaignName,
  validateInquisitorName,
  validateRecoveryCode,
} from "../utils/validation";
import { buildRoute } from "../constants/routes";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import {
  archiveCampaign,
  createCampaign,
  deleteCampaign,
  preflightCampaignDeletion,
  restoreCampaign,
  updateCampaignDetails,
} from "../services/campaignService";
import type { CampaignWithId } from "../types/Firestore";
import {
  uiSection,
  editableInputClass,
  uiFormLabel,
  uiTextPlaceholder,
} from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { ExpandChevron } from "../ui/icons/ExpandChevron";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { QrModal } from "../ui/modals/QrModal";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";
import { ConfirmInline } from "../ui/forms/ConfirmInline";
import { ClaimPreview } from "./ClaimCharacter/ClaimPreview";
import { useRecoveryLookup } from "../hooks/useRecoveryLookup";
import { claimCharacter } from "../services/characterService";
import { CustomFormShell } from "../ui/forms/CustomFormShell";
import { CustomFormSection } from "../ui/forms/CustomFormSection";
import { RequiredFormLabel } from "../ui/forms/RequiredFormLabel";
import { RecoveryCodeInput } from "../ui/forms/RecoveryCodeInput";
import { formatRecoveryCodeInput } from "../utils/recoveryCode";
import { colourActiveRose, colourActiveSky, colourRequiredText } from "../ui/styles/colourTokens";
import { DESKTOP_LAYOUT_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { useSwipeableTabs } from "../hooks/useSwipeableTabs";
import { SegmentedTabs, type SegmentedTabOption } from "../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../ui/styles/segmentedTabStyles";

interface Props {
  user: User;
  effectiveUserId: string;
  isLinked: boolean;
  firstName: string | null;
}

type CampaignGroup = "yours" | "playing";
const CAMPAIGN_GROUPS = ["yours", "playing"] as const satisfies readonly CampaignGroup[];
const CAMPAIGN_GROUP_TABS = [
  {
    value: "yours",
    label: "Your Campaigns",
    activeClassName: colourActiveSky,
  },
  {
    value: "playing",
    label: "Playing In",
    activeClassName: colourActiveRose,
  },
] as const satisfies readonly SegmentedTabOption<CampaignGroup>[];
const CAMPAIGN_GROUP_TABS_ID = "dashboard-campaign-groups";

interface DeletePreflightState {
  loading: boolean;
  result?: { jobId: string; totalCount: number };
  error?: string;
}

function CampaignListLimitNotice() {
  return (
    <p className="text-xs text-amber-300 lg:text-sm">
      Showing the first {FIRESTORE_QUERY_LIMITS.activeCampaignsPerRole} campaigns.
    </p>
  );
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

// ─── Player campaign row ──────────────────────────────────────────────────────

function PlayerCampaignRow({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  return (
    <Link
      to={buildRoute.campaignOverview(campaignId)}
      className={uiSection + " flex items-center gap-2 hover:bg-slate-800 transition-colors"}
    >
      <span className="flex-1 font-medium text-slate-200 lg:text-lg">{campaignName}</span>
    </Link>
  );
}

// ─── DM campaign list (create / edit / archive / delete) ─────────────────────

function DmCampaignList({
  userUid,
  campaigns,
  loading,
  error,
}: {
  userUid: string;
  campaigns: CampaignWithId[];
  loading: boolean;
  error: Error | null;
}) {
  const {
    campaigns: archivedCampaigns,
    loading: archivedLoading,
    error: archivedError,
  } = useArchivedCampaigns(userUid);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newInquisitorName, setNewInquisitorName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const createFormScrollPositionRef = useRef(0);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editInquisitorName, setEditInquisitorName] = useState("");
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{
    processedCount: number;
    totalCount: number;
  } | null>(null);
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
      await createCampaign(name, inquisitorName || undefined);
      setNewCampaignName("");
      setNewInquisitorName("");
      setShowCreateForm(false);
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [newCampaignName, newInquisitorName, toast]);

  const closeCreateForm = useCallback(() => {
    if (creatingRef.current) return;
    setShowCreateForm(false);
    setNewCampaignName("");
    setNewInquisitorName("");
  }, []);

  const campaignNameValid = validateCampaignName(newCampaignName.trim()).isValid;
  const inquisitorNameValid =
    !newInquisitorName.trim() || validateInquisitorName(newInquisitorName.trim()).isValid;

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
    <section className="space-y-3">
      {/* Active campaigns */}
      <SectionHeader>Your Campaigns</SectionHeader>

      {error ? (
        <ErrorState>Unable to load campaigns. Please refresh the page.</ErrorState>
      ) : loading ? (
        <LoadingState>Loading campaigns…</LoadingState>
      ) : campaigns.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
          You have not created any campaigns yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) =>
            editingId === campaign.id ? (
              <form
                key={campaign.id}
                className={uiSection + " space-y-2"}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleEditSave();
                }}
              >
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
                  <Button type="submit" size="sm" disabled={editing}>
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
              </form>
            ) : (
              <div
                key={campaign.id}
                className={
                  uiSection + " flex items-center gap-2 hover:bg-slate-800 transition-colors"
                }
              >
                <Link
                  to={buildRoute.campaignOverview(campaign.id)}
                  className="min-w-0 flex-1 font-medium text-slate-200 lg:text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                >
                  {campaign.name}
                </Link>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
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
              </div>
            )
          )}
        </div>
      )}

      {!error && !loading && campaigns.length === FIRESTORE_QUERY_LIMITS.activeCampaignsPerRole && (
        <CampaignListLimitNotice />
      )}

      <Button onClick={() => setShowCreateForm(true)}>Create campaign</Button>

      {showCreateForm && (
        <CustomFormShell
          title="Create Campaign"
          scrollPositionRef={createFormScrollPositionRef}
          canSubmit={campaignNameValid && inquisitorNameValid}
          submitLabel="Create campaign"
          savingLabel="Creating…"
          saving={creating}
          onSubmit={handleCreate}
          onClose={closeCreateForm}
          onCancel={closeCreateForm}
          maxWidth="max-w-lg"
        >
          <CustomFormSection title="Campaign Details">
            <div>
              <RequiredFormLabel htmlFor="new-campaign-name">Campaign Name</RequiredFormLabel>
              <input
                id="new-campaign-name"
                required
                autoFocus
                className={`${editableInputClass(true)} mt-0.5`}
                placeholder="Campaign name…"
                value={newCampaignName}
                maxLength={PRODUCT_LIMITS.campaignNameCharacters}
                onChange={(event) => setNewCampaignName(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="new-inquisitor-name" className={uiFormLabel}>
                Inquisitor Name{" "}
                <span className="normal-case tracking-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="new-inquisitor-name"
                className={`${editableInputClass(true)} mt-0.5`}
                placeholder="Inquisitor name…"
                value={newInquisitorName}
                maxLength={PRODUCT_LIMITS.inquisitorNameCharacters}
                onChange={(event) => setNewInquisitorName(event.target.value)}
              />
            </div>
          </CustomFormSection>
        </CustomFormShell>
      )}

      {/* Archived */}
      {archivedError ? (
        <ErrorState>Unable to load archived campaigns.</ErrorState>
      ) : archivedLoading ? (
        <LoadingState>Loading archived campaigns…</LoadingState>
      ) : archivedCampaigns.length > 0 ? (
        <div>
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
                      deletePreflights[campaign.id]?.loading ||
                      !deletePreflights[campaign.id]?.result
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
              {archivedCampaigns.length === FIRESTORE_QUERY_LIMITS.archivedCampaigns && (
                <CampaignListLimitNotice />
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
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
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const formScrollPositionRef = useRef(0);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const showErrorToast = toast.error;
  const showWarningToast = toast.warning;
  const handledUrlCodeRef = useRef<string | null>(null);

  const { loading, error, data, lookup, reset: resetLookup } = useRecoveryLookup();

  useEffect(() => {
    if (open && error) {
      showErrorToast(error);
    }
  }, [error, open, showErrorToast]);

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (!codeParam) {
      handledUrlCodeRef.current = null;
      return;
    }
    if (handledUrlCodeRef.current === codeParam) return;
    handledUrlCodeRef.current = codeParam;
    const normalizedCode = formatRecoveryCodeInput(codeParam);
    setCode(normalizedCode);
    setOpen(true);
    if (validateRecoveryCode(normalizedCode).isValid) {
      lookup(normalizedCode);
    } else {
      showWarningToast("This recovery-code link is invalid.");
    }
  }, [lookup, searchParams, showWarningToast]);

  const handleLookup = useCallback(() => {
    lookup(formatRecoveryCodeInput(code));
  }, [lookup, code]);

  const closeForm = useCallback(() => {
    if (claiming) return;
    resetLookup();
    setOpen(false);
    setCode("");
    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextSearchParams.has("code")) {
      nextSearchParams.delete("code");
      setSearchParams(nextSearchParams, { replace: true });
    }
    handledUrlCodeRef.current = null;
  }, [claiming, resetLookup, searchParams, setSearchParams]);

  const normalizedCode = formatRecoveryCodeInput(code);
  const codeValid = validateRecoveryCode(normalizedCode).isValid;

  const handleClaim = useCallback(async () => {
    if (!data || claiming) return;
    if (data.ownership !== "unclaimed") {
      toast.warning("This character cannot be claimed.");
      return;
    }
    try {
      setClaiming(true);
      const result = await claimCharacter(normalizedCode);
      navigate(buildRoute.characterSheet(result.campaignId, result.characterId));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to claim character. It may have been claimed already.";
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  }, [data, claiming, navigate, toast, normalizedCode]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Claim a character</Button>

      {open && (
        <CustomFormShell
          title="Claim a Character"
          scrollPositionRef={formScrollPositionRef}
          canSubmit={codeValid && !loading}
          submitLabel="Find character"
          savingLabel="Checking…"
          saving={loading}
          onSubmit={handleLookup}
          onClose={closeForm}
          onCancel={closeForm}
          maxWidth="max-w-lg"
        >
          <CustomFormSection title="Character Code">
            <RecoveryCodeInput
              value={code}
              onValueChange={setCode}
              disabled={loading || claiming}
              appearance="form"
              label={
                <>
                  Recovery Code{" "}
                  <span className={colourRequiredText} aria-hidden="true">
                    *
                  </span>
                </>
              }
              labelClassName={uiFormLabel}
            />
          </CustomFormSection>

          {data && (
            <ClaimPreview
              characterName={data.characterName}
              campaignName={data.campaignName}
              ownership={data.ownership}
              onClaim={handleClaim}
            />
          )}

          {claiming && (
            <p className="text-center text-xs text-slate-400 lg:text-sm">Claiming character…</p>
          )}
        </CustomFormShell>
      )}
    </>
  );
}

function PlayerCampaignSection({
  campaigns,
  loading,
  error,
}: {
  campaigns: CampaignWithId[];
  loading: boolean;
  error: Error | null;
}) {
  return (
    <section className="space-y-3">
      <SectionHeader>Campaigns You Play In</SectionHeader>

      {error ? (
        <ErrorState>Unable to load campaigns. Please refresh the page.</ErrorState>
      ) : loading ? (
        <LoadingState>Loading campaigns…</LoadingState>
      ) : null}

      {!error && !loading && campaigns.length === 0 && (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
          You are not part of any campaigns yet.
        </p>
      )}

      {!error && !loading && campaigns.length > 0 && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <PlayerCampaignRow
              key={campaign.id}
              campaignId={campaign.id}
              campaignName={campaign.name}
            />
          ))}
        </div>
      )}
      {!error && !loading && campaigns.length === FIRESTORE_QUERY_LIMITS.activeCampaignsPerRole && (
        <CampaignListLimitNotice />
      )}
      <ClaimCharacterSection />
    </section>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ user, effectiveUserId, isLinked, firstName }: Props) {
  const { dmCampaigns, playerCampaigns, dmLoading, playerLoading, dmError, playerError } =
    useCampaignsContext();
  const isDesktopLayout = useMediaQuery(DESKTOP_LAYOUT_QUERY);
  const [activeCampaignGroup, setActiveCampaignGroup] = useState<CampaignGroup>("yours");
  const {
    containerRef,
    transitionClass,
    switchTo: switchCampaignGroup,
  } = useSwipeableTabs(CAMPAIGN_GROUPS, activeCampaignGroup, setActiveCampaignGroup);

  const yourCampaignsSection = (
    <div className="min-w-0 space-y-6">
      <DmCampaignList
        userUid={effectiveUserId}
        campaigns={dmCampaigns}
        loading={dmLoading}
        error={dmError}
      />

      {dmCampaigns.length > 0 && !isLinked && <QrPanel />}
    </div>
  );
  const playingCampaignsSection = (
    <PlayerCampaignSection
      campaigns={playerCampaigns}
      loading={playerLoading}
      error={playerError}
    />
  );

  return (
    <PageShell title={firstName ? `${firstName}'s Dashboard` : "Dashboard"}>
      <RecoveryBackupBanner ownUid={user.uid} effectiveUserId={effectiveUserId} />

      {isDesktopLayout ? (
        <div className="grid grid-cols-2 items-start gap-6">
          <div className={`${uiSection} min-w-0`}>{yourCampaignsSection}</div>
          <div className={`${uiSection} min-w-0`}>{playingCampaignsSection}</div>
        </div>
      ) : (
        <Panel>
          <div ref={containerRef} className="space-y-4">
            <SegmentedTabs
              id={CAMPAIGN_GROUP_TABS_ID}
              ariaLabel="Campaign groups"
              options={CAMPAIGN_GROUP_TABS}
              value={activeCampaignGroup}
              onChange={switchCampaignGroup}
            />

            <div
              key={activeCampaignGroup}
              id={segmentedTabPanelId(CAMPAIGN_GROUP_TABS_ID, activeCampaignGroup)}
              aria-labelledby={segmentedTabId(CAMPAIGN_GROUP_TABS_ID, activeCampaignGroup)}
              className={[uiSwipeableTabPanel, transitionClass].join(" ")}
              role="tabpanel"
            >
              {activeCampaignGroup === "yours" ? yourCampaignsSection : playingCampaignsSection}
            </div>
          </div>
        </Panel>
      )}
    </PageShell>
  );
}
