// src/pages/CampaignOverview.tsx

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useCampaign } from "../hooks/useCampaign";
import { CustomItemLibraryAdmin } from "./CampaignOverview/CustomItemLibraryAdmin";
import { PartySection } from "./CampaignOverview/PartySection";
import { SessionHistorySection } from "./CampaignOverview/SessionHistorySection";
import {
  DEFAULT_CAMPAIGN_SECTION,
  getCampaignNavigation,
  getCampaignSectionLabel,
  isCampaignSectionAllowed,
  type CampaignSectionId,
} from "./CampaignOverview/sections";
import { importCharacter, repairCharacterSummaries } from "../services/characterService";
import { repairSessionSummaries } from "../services/sessionService";
import { readCharacterImportFile } from "../firestore/firebaseValidation";
import { useToast } from "../components/Toast";
import { SectionDrawer } from "../components/SectionDrawer";
import { IMPORTANT_TOAST_DURATION } from "../constants/ui";
import { uiSubheading, uiStackList } from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { TitleToolbar } from "../ui/TitleToolbar";
import { ErrorPage } from "../ui/ErrorPage";
import { useRouteActive, useRouteLoading, useRouteLoadTimedOut } from "../context/useRouteReady";
import { useHeaderExtensionSetters } from "../context/useHeaderExtension";
import { RouteLoadError } from "../ui/RouteLoadError";
import { recordComponentRender } from "../performance/performanceMetrics";

export default function CampaignOverview({ effectiveUserId }: { effectiveUserId: string }) {
  recordComponentRender("CampaignOverview");
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    campaign,
    loading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId ?? null);
  const isDM = campaign?.dmId === effectiveUserId;
  useRouteLoading(campaignLoading);
  const routeActive = useRouteActive();
  const routeTimedOut = useRouteLoadTimedOut();
  const toast = useToast();
  const { setKebabContent, clearKebabContent } = useHeaderExtensionSetters();

  const requestedSection = searchParams.get("section");
  const requestedSectionIsAllowed = isCampaignSectionAllowed(requestedSection, isDM);
  const activeSection: CampaignSectionId = requestedSectionIsAllowed
    ? requestedSection
    : DEFAULT_CAMPAIGN_SECTION;

  useEffect(() => {
    if (!campaign || requestedSection === null || requestedSectionIsAllowed) return;
    navigate(`?section=${DEFAULT_CAMPAIGN_SECTION}`, { replace: true });
  }, [campaign, navigate, requestedSection, requestedSectionIsAllowed]);

  const handleSectionChange = useCallback(
    (id: string) => {
      navigate(`?section=${id}`);
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [navigate]
  );

  const [importingCharacter, setImportingCharacter] = useState(false);
  const importingCharacterRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [repairingSummaries, setRepairingSummaries] = useState(false);
  const repairingSummariesRef = useRef(false);
  const [repairingSessionSummaries, setRepairingSessionSummaries] = useState(false);
  const repairingSessionSummariesRef = useRef(false);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = e.target.files?.[0];
      if (!file || !campaignId) return;
      if (importingCharacterRef.current) {
        input.value = "";
        return;
      }
      importingCharacterRef.current = true;
      setImportingCharacter(true);
      try {
        const data = await readCharacterImportFile(file);
        const characterName = await importCharacter(campaignId, data);
        toast.success(`Imported "${characterName}" successfully`, IMPORTANT_TOAST_DURATION);
      } catch (err) {
        console.error("Failed to import character:", err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to import character. Check the file and try again."
        );
      } finally {
        importingCharacterRef.current = false;
        setImportingCharacter(false);
        input.value = "";
      }
    },
    [campaignId, toast]
  );

  const handleRepairSummaries = useCallback(async () => {
    if (repairingSummariesRef.current || !campaignId) return;
    repairingSummariesRef.current = true;
    setRepairingSummaries(true);
    try {
      const count = await repairCharacterSummaries(campaignId);
      toast.success(`Repaired ${count} character ${count === 1 ? "summary" : "summaries"}.`);
    } catch (err) {
      console.error("Failed to repair character summaries:", err);
      toast.error(err instanceof Error ? err.message : "Failed to repair character summaries.");
    } finally {
      repairingSummariesRef.current = false;
      setRepairingSummaries(false);
    }
  }, [campaignId, toast]);

  const handleRepairSessionSummaries = useCallback(async () => {
    if (repairingSessionSummariesRef.current || !campaignId) return;
    repairingSessionSummariesRef.current = true;
    setRepairingSessionSummaries(true);
    try {
      const count = await repairSessionSummaries(campaignId);
      toast.success(`Repaired ${count} session ${count === 1 ? "summary" : "summaries"}.`);
    } catch (err) {
      console.error("Failed to repair session summaries:", err);
      toast.error(err instanceof Error ? err.message : "Failed to repair session summaries.");
    } finally {
      repairingSessionSummariesRef.current = false;
      setRepairingSessionSummaries(false);
    }
  }, [campaignId, toast]);

  // Inject Import JSON into header kebab for DMs
  useLayoutEffect(() => {
    if (!routeActive) return;
    if (!isDM) {
      clearKebabContent();
      return;
    }
    setKebabContent(
      <div className={uiStackList}>
        <p className={uiSubheading}>Character Data</p>
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
          disabled={importingCharacter}
        />
        <Button
          variant="neutral"
          size="sm"
          fullWidth
          loading={importingCharacter}
          loadingLabel="Importing"
          onClick={() => importInputRef.current?.click()}
        >
          Import JSON
        </Button>
        <Button
          variant="neutral"
          size="sm"
          fullWidth
          loading={repairingSummaries}
          loadingLabel="Repairing"
          onClick={handleRepairSummaries}
        >
          Repair Character Summaries
        </Button>
        <Button
          variant="neutral"
          size="sm"
          fullWidth
          loading={repairingSessionSummaries}
          loadingLabel="Repairing"
          onClick={handleRepairSessionSummaries}
        >
          Repair Session Summaries
        </Button>
      </div>
    );
    return () => clearKebabContent();
  }, [
    routeActive,
    isDM,
    importingCharacter,
    handleImport,
    repairingSummaries,
    handleRepairSummaries,
    repairingSessionSummaries,
    handleRepairSessionSummaries,
    setKebabContent,
    clearKebabContent,
  ]);

  if (!campaignId) {
    return <ErrorPage title="No Campaign Selected" />;
  }

  if (campaignError) {
    return <RouteLoadError resource="campaign" fullPage />;
  }

  if (campaignLoading) {
    return routeTimedOut ? <RouteLoadError resource="campaign" fullPage /> : null;
  }

  if (!campaign) {
    return <ErrorPage title="Campaign Not Found" />;
  }

  return (
    <PageShell title={campaign.name}>
      <TitleToolbar
        title={getCampaignSectionLabel(activeSection)}
        left={
          <SectionDrawer
            navigation={getCampaignNavigation(isDM)}
            activePage={activeSection}
            onPageChange={handleSectionChange}
          />
        }
      />
      <Panel>
        {activeSection === "party" && (
          <PartySection
            campaignId={campaignId}
            isDM={isDM}
            effectiveUserId={effectiveUserId}
            gmName={campaign.gmName}
            inquisitorName={campaign.inquisitorName}
          />
        )}
        {activeSection === "custom-items" && isDM && (
          <CustomItemLibraryAdmin campaignId={campaignId} userId={effectiveUserId} />
        )}
        {activeSection === "sessions" && (
          <SessionHistorySection campaignId={campaignId} isDM={isDM} />
        )}
      </Panel>
    </PageShell>
  );
}
