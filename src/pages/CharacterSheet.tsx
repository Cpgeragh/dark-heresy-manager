// src/pages/CharacterSheet.tsx

import {
  lazy,
  memo,
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useTransition,
} from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderExtensionSetters } from "../context/useHeaderExtension";
import { CharacterKebabContent } from "./CharacterSheet/CharacterKebabContent";

import { useCharacterSheet } from "./CharacterSheet/useCharacterSheet";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Button } from "../ui/buttons/Button";
import { IconButton } from "../ui/buttons/IconButton";
import { uiLayerForeground } from "../ui/styles/layerStyles";

import { VitalsTab } from "./CharacterSheet/VitalsTab";
import { InsanityTab } from "./CharacterSheet/InsanityTab";
import { CorruptionTab } from "./CharacterSheet/CorruptionTab";
import { CharacteristicsTab } from "./CharacterSheet/CharacteristicsTab";
import { SkillsTab } from "./CharacterSheet/SkillsTab";
import { TraitsTab } from "../mechanics/traits/TraitsTab";
import { ArmourTab } from "./CharacterSheet/ArmourTab";
import { DrugsTab } from "./CharacterSheet/DrugsTab";
import { ExperienceTab } from "./CharacterSheet/ExperienceTab";
import { NotesTab } from "./CharacterSheet/NotesTab";
import { AdminTab } from "./CharacterSheet/AdminTab";
import { BackgroundTab } from "./CharacterSheet/BackgroundTab";
import { CompleteBackgroundSetupModal } from "./CharacterSheet/BackgroundTab/CompleteBackgroundSetupModal";
import { WeaponTrainingTab } from "./CharacterSheet/WeaponTrainingTab";
import { CompanionsTab } from "./CharacterSheet/CompanionsTab";

import { isTabId, type TabId } from "./CharacterSheet/types";
import type {
  CharacterHeader,
  WoundsBlock,
  FateBlock,
  InsanityBlock,
  CorruptionBlock,
  ExperienceBlock,
  SkillEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  RangedWeapon,
  MeleeWeapon,
  GrenadeItem,
  ShieldItem,
  WornArmourPiece,
  GearItem,
  ConsumableItem,
  DrugItem,
  CyberneticItem,
  ArcheotechItem,
  PsychicBlock,
  CompanionItem,
  NoteEntry,
} from "../types/Character";

import { exportCharacterJson } from "../utils/exportCharacter";
import { isBackgroundComplete } from "../utils/characterFactory";
import { getSpentXp } from "shared-rules";
import {
  reconcileCharacterSpentXp,
  registerRecoveryCode,
  revokeRecoveryCode,
} from "../services/characterService";
import { SectionDrawer } from "../components/SectionDrawer";
import { useUserProfile } from "../hooks/useUserProfile";
import { useRouteActive, useRouteLoading, useRouteLoadTimedOut } from "../context/useRouteReady";
import { PendingOverlay } from "../ui/PendingOverlay";
import { ROUTES } from "../constants/routes";
import { RouteLoadError } from "../ui/RouteLoadError";
import { recordComponentRender } from "../performance/performanceMetrics";
import type { PatchOptions } from "../hooks/useOptimisticOverlay";
import { TitleToolbar } from "../ui/TitleToolbar";
import { ChevronUpIcon } from "../ui/icons/ChevronUpIcon";
import { MessageIcon } from "../ui/icons/MessageIcon";
import { uiSectionShell, uiTextBody, uiTextError, uiTextMeta } from "../ui/styles/editableStyles";
import { ErrorState } from "../ui/ErrorState";
import {
  CampaignCustomItemsScope,
  useCampaignCustomItemsRaw,
} from "../hooks/useCampaignCustomItems";
import { useCampaignsContext } from "../context/useCampaignsContext";
import { ToggleButton } from "../ui/buttons/ToggleButton";
import {
  colourAmberPlain,
  colourEditOverrideSurface,
  colourToggleSelectedAmber,
  colourFillFloating,
} from "../ui/styles/colourTokens";

const TalentsTab = memo(
  lazy(() =>
    import("../mechanics/talents/TalentsTab").then(({ TalentsTab }) => ({ default: TalentsTab }))
  )
);
const EliteAdvancesTab = memo(
  lazy(() =>
    import("../mechanics/eliteAdvances/EliteAdvancesTab").then(({ EliteAdvancesTab }) => ({
      default: EliteAdvancesTab,
    }))
  )
);
const WeaponsTab = memo(
  lazy(() =>
    import("./CharacterSheet/WeaponsTab").then(({ WeaponsTab }) => ({ default: WeaponsTab }))
  )
);
const CyberneticsTab = memo(
  lazy(() =>
    import("./CharacterSheet/CyberneticsTab").then(({ CyberneticsTab }) => ({
      default: CyberneticsTab,
    }))
  )
);
const PsychicTab = memo(
  lazy(() =>
    import("./CharacterSheet/PsychicTab").then(({ PsychicTab }) => ({ default: PsychicTab }))
  )
);
const GearTab = memo(
  lazy(() => import("./CharacterSheet/GearTab").then(({ GearTab }) => ({ default: GearTab })))
);
const ArcheotechTab = lazy(() =>
  import("./CharacterSheet/ArcheotechTab").then(({ ArcheotechTab }) => ({
    default: ArcheotechTab,
  }))
);

function ReleasingFrame() {
  return (
    <div className="relative min-h-48">
      <PendingOverlay active />
    </div>
  );
}

function TabSuspenseFallback() {
  useRouteLoading(true);
  return (
    <div className="relative min-h-48">
      <PendingOverlay active />
    </div>
  );
}

const MemoizedCharacteristicsTab = memo(CharacteristicsTab);
const MemoizedSkillsTab = memo(SkillsTab);
const MemoizedArmourTab = memo(ArmourTab);

const EMPTY_CYBERNETICS: CyberneticItem[] = [];
const EMPTY_ARCHAEOTECH: ArcheotechItem[] = [];
const EMPTY_RANGED_WEAPONS: RangedWeapon[] = [];
const EMPTY_MELEE_WEAPONS: MeleeWeapon[] = [];
const EMPTY_ARMOUR: WornArmourPiece[] = [];
const EMPTY_GRENADES: GrenadeItem[] = [];
const EMPTY_SHIELDS: ShieldItem[] = [];
const EMPTY_CONSUMABLES: ConsumableItem[] = [];
const EMPTY_GEAR: GearItem[] = [];
const EMPTY_COMPANIONS: CompanionItem[] = [];
const EMPTY_DRUGS: DrugItem[] = [];
const EMPTY_NOTES: NoteEntry[] = [];

function isPermissionDenied(error: Error | null): boolean {
  if (!error) return false;
  const code = (error as Error & { code?: unknown }).code;
  return code === "permission-denied" || error.message.includes("permission-denied");
}

// ================================================================
// COMPONENT
// ================================================================

export default function CharacterSheet({
  effectiveUserId,
  effectiveUserFirstName,
  onOpenMessages,
}: {
  effectiveUserId: string;
  effectiveUserFirstName: string;
  onOpenMessages: () => void;
}) {
  recordComponentRender("CharacterSheet");
  const params = useParams<{ campaignId: string; characterId: string }>();
  const { dmCampaigns, playerCampaigns } = useCampaignsContext();

  const {
    path,
    character,
    characterLoading,
    characterError,
    allowedToEdit,
    isOwner,
    canPlayerRelease,
    isDM,
    isDMLoading,
    memberIds,

    dmReadOnly,
    toggleDmReadOnly,

    getCharField,
    getEffectiveCharTotal,
    getCharBonus,
    characteristicModifierTotals,
    characteristicModifierSources,
    updateCharacteristic,
    updateField,
    patchField,
    patchFieldWithResult,
    patchFieldsWithResult,
    patchCollectionField,
    adjustXp,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,

    // Loading states
    isReleasing,
    isDmForceReleasing,
    isDmForceAssigning,
    isDmTogglingEdit,
    isUpdating,
  } = useCharacterSheet({
    campaignIdParam: params.campaignId,
    characterIdParam: params.characterId,
    effectiveUserId,
  });

  const knownRole = !isDMLoading
    ? isDM
      ? "admin"
      : "picker"
    : dmCampaigns.some((item) => item.id === params.campaignId)
      ? "admin"
      : playerCampaigns.some((item) => item.id === params.campaignId)
        ? "picker"
        : null;

  const {
    items: customItems,
    loading: customItemsLoading,
    error: customItemsError,
  } = useCampaignCustomItemsRaw({
    campaignId: params.campaignId,
    mode: knownRole ?? "picker",
    userId: effectiveUserId,
  });

  useEffect(() => {
    if (!params.campaignId || !params.characterId) return;
    // Start the split tab downloads during the existing character load.
    void Promise.all([
      import("./CharacterSheet/WeaponsTab"),
      import("./CharacterSheet/GearTab"),
      import("./CharacterSheet/ArcheotechTab"),
      import("./CharacterSheet/CyberneticsTab"),
      import("../mechanics/talents/TalentsTab"),
      import("../mechanics/eliteAdvances/EliteAdvancesTab"),
      import("./CharacterSheet/PsychicTab"),
    ]);
  }, [params.campaignId, params.characterId]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedTabIsAllowed = isTabId(requestedTab) && (requestedTab !== "admin" || isDM);
  const activeTab: TabId = requestedTabIsAllowed ? requestedTab : "stats";

  useEffect(() => {
    if (isDMLoading || requestedTab === null || requestedTabIsAllowed) return;
    navigate("?tab=stats", { replace: true });
  }, [isDMLoading, navigate, requestedTab, requestedTabIsAllowed]);

  // The owner's player name is derived live from their public profile so it
  // stays in sync with their account first name (falls back to the legacy
  // header.playerName for characters claimed before profiles existed).
  const ownerUserId = character?.userId;
  const isEffectiveUserOwner = !!ownerUserId && ownerUserId === effectiveUserId;
  const {
    firstName: subscribedOwnerFirstName,
    loading: subscribedOwnerProfileLoading,
    error: ownerProfileError,
  } = useUserProfile(ownerUserId && !isEffectiveUserOwner ? ownerUserId : null);
  const ownerFirstName = isEffectiveUserOwner ? effectiveUserFirstName : subscribedOwnerFirstName;
  const ownerName = ownerFirstName ?? character?.header.playerName?.trim() ?? null;
  const ownerProfileUnresolved =
    !!ownerUserId &&
    !isEffectiveUserOwner &&
    (subscribedOwnerProfileLoading || ownerProfileError !== null);
  const psyRating = useMemo(
    () =>
      (character?.talentsAndTraits.talents ?? []).reduce((max, entry) => {
        const match = entry.talentId.match(/^psy-rating-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0),
    [character?.talentsAndTraits.talents]
  );

  const [tabPending, startTabTransition] = useTransition();
  const handleTabChange = useCallback(
    (tab: TabId) => {
      startTabTransition(() => navigate(`?tab=${tab}`));
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [navigate, startTabTransition]
  );

  const basePath = `/campaign/${params.campaignId}/character/${params.characterId}`;

  // Players must explicitly confirm their required Background setup before
  // entering the sheet. DM browsing is never gated, and confirmation is
  // permanent even if a field is changed later.
  const backgroundSatisfied = character ? isBackgroundComplete(character) : true;

  // Single source of truth for experience.spent, recalculated from what's
  // actually owned. The local comparison avoids a transaction read in the
  // normal case; the service rechecks a fresh snapshot before correcting only
  // the derived nested field, making concurrent tabs settle after one write.
  useEffect(() => {
    if (!character || !allowedToEdit) return;
    const computedSpent = getSpentXp(character);
    if (character.experience.spent === computedSpent) return;
    void reconcileCharacterSpentXp(character.campaignId, character.id).catch((error) => {
      console.error("Failed to reconcile XP spent:", error);
    });
  }, [character, allowedToEdit]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      const onCharSheet = window.location.pathname.startsWith(basePath);
      const atFloor = onCharSheet && !window.location.search.includes("tab=");

      if (!onCharSheet) {
        // Safety net: redirect back if somehow the sentinel was exhausted
        navigate(`${basePath}?tab=stats`, { replace: true });
      } else if (atFloor) {
        // Hit the floor (stats, no tab param), replenish the sentinel
        window.history.pushState(null, "", window.location.href);
      }
      // Tab-to-tab back navigation: do nothing, works normally
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [basePath, navigate]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { setBackHref, clearBackHref, setKebabContent, clearKebabContent } =
    useHeaderExtensionSetters();

  const characterRouteKey = path ? `${path.campaignId}/${path.characterId}` : null;
  const [loadedCharacterRouteKey, setLoadedCharacterRouteKey] = useState<string | null>(null);

  if (character && characterRouteKey && loadedCharacterRouteKey !== characterRouteKey) {
    setLoadedCharacterRouteKey(characterRouteKey);
  }

  const accessWasRevoked =
    characterRouteKey !== null &&
    loadedCharacterRouteKey === characterRouteKey &&
    isPermissionDenied(characterError);

  const routeActive = useRouteActive();
  const routeTimedOut = useRouteLoadTimedOut();
  useRouteLoading(characterLoading || isDMLoading || customItemsLoading);

  useEffect(() => {
    if (!accessWasRevoked) return;
    if (routeActive) clearKebabContent();
    navigate(ROUTES.DASHBOARD, { replace: true });
  }, [accessWasRevoked, routeActive, clearKebabContent, navigate]);

  const handleGenerateRecoveryCode = useCallback(async () => {
    if (!params.campaignId || !params.characterId) return;
    await registerRecoveryCode(params.campaignId, params.characterId);
  }, [params.campaignId, params.characterId]);

  const handleRevokeRecoveryCode = useCallback(async () => {
    if (!params.campaignId || !params.characterId) return;
    await revokeRecoveryCode(params.campaignId, params.characterId);
  }, [params.campaignId, params.characterId]);

  const handlePlayerRelease = useCallback(async () => {
    const released = await releaseCharacter();
    if (!released) return;
    clearKebabContent();
    navigate(ROUTES.DASHBOARD, { replace: true });
  }, [releaseCharacter, clearKebabContent, navigate]);

  useEffect(() => {
    if (!routeActive || !character || isDMLoading) return;

    setBackHref(ROUTES.DASHBOARD);

    setKebabContent(
      <CharacterKebabContent
        recoveryCode={character.recoveryCode}
        canManageRecoveryCode={isDM}
        onGenerateRecoveryCode={handleGenerateRecoveryCode}
        onRevokeRecoveryCode={handleRevokeRecoveryCode}
        canExport={isDM || isOwner}
        onExport={() => exportCharacterJson(character)}
        canPlayerRelease={canPlayerRelease}
        onPlayerRelease={handlePlayerRelease}
        isReleasing={isReleasing}
      />
    );

    return () => {
      clearBackHref();
      clearKebabContent();
    };
  }, [
    routeActive,
    character,
    isDM,
    isDMLoading,
    isOwner,
    canPlayerRelease,
    handlePlayerRelease,
    handleGenerateRecoveryCode,
    handleRevokeRecoveryCode,
    isReleasing,
    setBackHref,
    clearBackHref,
    setKebabContent,
    clearKebabContent,
  ]);

  // ================================================================
  // STABLE UPDATE CALLBACKS (eliminate inline functions)
  // ================================================================

  const handleUpdateHeader = useCallback(
    (next: CharacterHeader, options?: PatchOptions) => patchField("header", next, options),
    [patchField]
  );

  const handleUpdateWounds = useCallback(
    (next: WoundsBlock, options?: PatchOptions) => patchField("wounds", next, options),
    [patchField]
  );

  const handleUpdateFate = useCallback(
    (next: FateBlock, options?: PatchOptions) => patchField("fate", next, options),
    [patchField]
  );

  const handleUpdateInsanity = useCallback(
    (next: InsanityBlock, options?: PatchOptions) => patchField("insanity", next, options),
    [patchField]
  );

  const handleUpdateCorruption = useCallback(
    (next: CorruptionBlock, options?: PatchOptions) => patchField("corruption", next, options),
    [patchField]
  );

  const handleUpdateSkills = useCallback(
    (next: SkillEntry[]) => patchField("skills", next),
    [patchField]
  );

  const handleUpdateTalents = useCallback(
    (next: TalentsAndTraitsBlock) => patchField("talentsAndTraits", next),
    [patchField]
  );

  const handleUpdateWeaponTraining = useCallback(
    (next: WeaponTrainingBlock) => patchField("weaponTraining", next),
    [patchField]
  );

  const handleUpdateRangedWeapons = useCallback(
    (next: RangedWeapon[], options?: PatchOptions) =>
      patchCollectionField(
        "rangedWeapons",
        character?.rangedWeapons ?? EMPTY_RANGED_WEAPONS,
        next,
        options
      ),
    [character?.rangedWeapons, patchCollectionField]
  );

  const handleUpdateMeleeWeapons = useCallback(
    (next: MeleeWeapon[], options?: PatchOptions) =>
      patchCollectionField(
        "meleeWeapons",
        character?.meleeWeapons ?? EMPTY_MELEE_WEAPONS,
        next,
        options
      ),
    [character?.meleeWeapons, patchCollectionField]
  );

  const handleUpdateArmour = useCallback(
    (next: WornArmourPiece[], options?: PatchOptions) =>
      patchCollectionField("armour", character?.armour ?? EMPTY_ARMOUR, next, options),
    [character?.armour, patchCollectionField]
  );

  const handleUpdatePsychic = useCallback(
    (next: PsychicBlock, options?: PatchOptions) => patchField("psychic", next, options),
    [patchField]
  );

  const handleUpdateGear = useCallback(
    (next: GearItem[], options?: PatchOptions) => patchField("gear", next, options),
    [patchField]
  );

  const handleUpdateCompanions = useCallback(
    (next: CompanionItem[], options?: PatchOptions) => patchField("companions", next, options),
    [patchField]
  );

  const handleUpdateConsumables = useCallback(
    (next: ConsumableItem[], options?: PatchOptions) =>
      patchCollectionField(
        "consumables",
        character?.consumables ?? EMPTY_CONSUMABLES,
        next,
        options
      ),
    [character?.consumables, patchCollectionField]
  );

  const handleUpdateDrugs = useCallback(
    (next: DrugItem[], options?: PatchOptions) =>
      patchCollectionField("drugs", character?.drugs ?? EMPTY_DRUGS, next, options),
    [character?.drugs, patchCollectionField]
  );

  const handleUpdateGrenades = useCallback(
    (next: GrenadeItem[], options?: PatchOptions) =>
      patchCollectionField("grenades", character?.grenades ?? EMPTY_GRENADES, next, options),
    [character?.grenades, patchCollectionField]
  );

  const handleUpdateShields = useCallback(
    (next: ShieldItem[], options?: PatchOptions) => patchField("shields", next, options),
    [patchField]
  );

  const handleUpdateCybernetics = useCallback(
    (next: CyberneticItem[], options?: PatchOptions) => patchField("cybernetics", next, options),
    [patchField]
  );

  const handleUpdateNotes = useCallback(
    (value: NoteEntry[], options?: PatchOptions) => patchField("notes", value, options),
    [patchField]
  );

  const handleUpdateExperience = useCallback(
    (next: ExperienceBlock) => patchFieldWithResult("experience", next),
    [patchFieldWithResult]
  );

  const handleUpdateArcheotech = useCallback(
    (next: ArcheotechItem[], options?: PatchOptions) => patchField("archeotech", next, options),
    [patchField]
  );

  // ================================================================
  // RENDERING LOGIC
  // ================================================================

  if (!path) {
    return <ErrorState className="py-10 text-center">Invalid character route.</ErrorState>;
  }

  if (isReleasing || accessWasRevoked) {
    return <ReleasingFrame />;
  }

  if (characterLoading || isDMLoading || customItemsLoading) {
    return routeTimedOut ? <RouteLoadError resource="character" /> : null;
  }

  if (characterError || customItemsError) {
    return <RouteLoadError resource="character" />;
  }

  if (!character) {
    return (
      <div className="py-10 text-center space-y-4">
        <p className={`text-lg font-semibold ${uiTextError}`}>Character not found.</p>
        <p className={`text-sm lg:text-base ${uiTextBody}`}>
          This character may have been deleted or the link is invalid.
        </p>
      </div>
    );
  }

  if (!isDM && !backgroundSatisfied) {
    return (
      <CompleteBackgroundSetupModal
        header={character.header}
        talents={character.talentsAndTraits}
        editable={allowedToEdit}
        saving={isUpdating}
        onUpdateHeader={handleUpdateHeader}
        onUpdateTalents={handleUpdateTalents}
        cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
        onUpdateCybernetics={handleUpdateCybernetics}
        gear={character.gear ?? EMPTY_GEAR}
        onUpdateGear={handleUpdateGear}
        onReturnToDashboard={() => navigate(ROUTES.DASHBOARD)}
        onComplete={() => {
          void updateField("backgroundComplete", true);
        }}
      />
    );
  }

  // Visual cue for DM override mode
  const dmOverrideActive = isDM && !dmReadOnly;

  const TAB_TITLES: Record<TabId, string> = {
    vitals: "Vitals",
    insanity: "Insanity",
    corruption: "Corruption & Mutations",
    stats: "Characteristics",
    skills: "Skills",
    talents: "Talents",
    "elite-advances": "Elite Advances",
    training: "Weapon Training",
    traits: "Traits",
    weapons: "Weapons",
    armour: "Armour",
    cybernetics: "Cybernetics",
    psychic: "Psychic Powers",
    gear: "Gear",
    companions: "Companions",
    drugs: "Drugs",
    xp: "Experience",
    notes: "Notes",
    background: "Background",
    archeotech: "Archeotech",
    admin: "Admin",
  };

  const containerClass = dmOverrideActive
    ? `rounded-lg border p-4 lg:p-5 transition-colors ${colourEditOverrideSurface}`
    : `${uiSectionShell} p-4 lg:p-5 transition-colors`;

  return (
    <CampaignCustomItemsScope
      campaignId={params.campaignId ?? ""}
      userId={effectiveUserId}
      mode={isDM ? "admin" : "picker"}
      result={{ items: customItems, loading: customItemsLoading, error: customItemsError }}
    >
      <div>
        {ownerProfileError && (
          <p className={`mb-4 text-sm lg:text-base ${colourAmberPlain}`}>
            Unable to refresh the owner&apos;s profile name; showing the stored name.
          </p>
        )}

        {/* DM NAV / OVERRIDE BAR */}
        {isDM && (
          <div className={`${uiSectionShell} flex items-center justify-between mb-4 p-2`}>
            <span className={uiTextMeta}>DM View</span>

            <ToggleButton
              selected={!dmReadOnly}
              selectedClassName={colourToggleSelectedAmber}
              onClick={toggleDmReadOnly}
              aria-label={dmReadOnly ? "Enable editing mode" : "Disable editing mode"}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5"
            >
              {dmReadOnly ? "Read-only" : "Editing enabled"}
            </ToggleButton>
          </div>
        )}

        {/* Balanced page toolbar: navigation, centred title, matching spacer */}
        <TitleToolbar
          className="mb-4"
          title={TAB_TITLES[activeTab]}
          left={<SectionDrawer activeTab={activeTab} onTabChange={handleTabChange} isDM={isDM} />}
          right={
            <IconButton
              label="Messages"
              onClick={onOpenMessages}
              className="h-10 w-10 justify-self-end"
              icon={<MessageIcon className="h-5 w-5" />}
            />
          }
        />

        {/* CONTENT CONTAINER */}
        <div
          className={`${containerClass} relative`}
          role="tabpanel"
          aria-label={`${activeTab} content`}
        >
          <ErrorBoundary
            fallback={
              <div className="p-6 text-center space-y-4">
                <div>
                  <p className="text-lg font-semibold mb-2">Failed to load this tab</p>
                  <p className={`text-sm lg:text-base ${uiTextError}`}>
                    An error occurred while displaying this content.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => handleTabChange("vitals")}>
                  Back to Overview
                </Button>
              </div>
            }
          >
            <Suspense fallback={<TabSuspenseFallback />}>
              {activeTab === "vitals" && (
                <VitalsTab
                  character={character}
                  editable={allowedToEdit}
                  toughnessBonus={getCharBonus("t")}
                  talents={character.talentsAndTraits}
                  onUpdateWounds={handleUpdateWounds}
                  onUpdateFate={handleUpdateFate}
                />
              )}

              {activeTab === "insanity" && (
                <InsanityTab
                  insanity={character.insanity}
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateInsanity}
                />
              )}

              {activeTab === "corruption" && (
                <CorruptionTab
                  corruption={character.corruption}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateCorruption}
                />
              )}

              {activeTab === "stats" && (
                <MemoizedCharacteristicsTab
                  getCharField={getCharField}
                  getEffectiveCharTotal={getEffectiveCharTotal}
                  getCharBonus={getCharBonus}
                  editable={allowedToEdit}
                  modifierTotals={characteristicModifierTotals}
                  modifierSources={characteristicModifierSources}
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                  rank={character.header.rank}
                  alternateRanks={character.experience.alternateRanks}
                  updateCharacteristic={updateCharacteristic}
                />
              )}

              {activeTab === "skills" && (
                <MemoizedSkillsTab
                  skills={character.skills}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateSkills}
                  getCharField={getCharField}
                  modifierTotals={characteristicModifierTotals}
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                  rank={character.header.rank}
                  alternateRanks={character.experience.alternateRanks}
                  isDM={isDM}
                />
              )}

              {activeTab === "talents" && (
                <TalentsTab
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                  rank={character.header.rank}
                  alternateRanks={character.experience.alternateRanks}
                  psychic={character.psychic}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  rangedWeapons={character.rangedWeapons}
                  meleeWeapons={character.meleeWeapons}
                  archeotech={character.archeotech ?? EMPTY_ARCHAEOTECH}
                  insanity={character.insanity}
                  willpowerBonus={getCharBonus("wp")}
                  weaponTraining={character.weaponTraining}
                  isDM={isDM}
                  editable={allowedToEdit}
                  onUpdateTalents={handleUpdateTalents}
                  onUpdateCharacter={patchFieldsWithResult}
                />
              )}

              {activeTab === "elite-advances" && (
                <EliteAdvancesTab
                  talents={character.talentsAndTraits}
                  skills={character.skills}
                  experience={character.experience}
                  insanity={character.insanity}
                  psychic={character.psychic}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  rangedWeapons={character.rangedWeapons}
                  meleeWeapons={character.meleeWeapons}
                  archeotech={character.archeotech ?? EMPTY_ARCHAEOTECH}
                  willpowerBonus={getCharBonus("wp")}
                  weaponTraining={character.weaponTraining}
                  career={character.header.career}
                  rank={character.header.rank}
                  isDM={isDM}
                  editable={allowedToEdit}
                  onUpdateCharacter={patchFieldsWithResult}
                />
              )}

              {activeTab === "training" && (
                <WeaponTrainingTab
                  weaponTraining={character.weaponTraining}
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                  rank={character.header.rank}
                  alternateRanks={character.experience.alternateRanks}
                  editable={allowedToEdit}
                  isDM={isDM}
                  onUpdate={handleUpdateWeaponTraining}
                />
              )}

              {activeTab === "traits" && (
                <TraitsTab
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                  rank={character.header.rank}
                  alternateRanks={character.experience.alternateRanks}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  gear={character.gear ?? EMPTY_GEAR}
                  editable={allowedToEdit}
                  onUpdateTalents={handleUpdateTalents}
                  onUpdateCybernetics={handleUpdateCybernetics}
                  onUpdateGear={handleUpdateGear}
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                />
              )}

              {activeTab === "weapons" && (
                <WeaponsTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  rangedWeapons={character.rangedWeapons}
                  meleeWeapons={character.meleeWeapons}
                  grenades={character.grenades ?? EMPTY_GRENADES}
                  editable={allowedToEdit}
                  strengthBonus={getCharBonus("s")}
                  knaveOfPistols={character.experience.alternateRanks?.some(
                    (selection) => selection.alternateRankId === "metallican-gunslinger"
                  )}
                  onUpdateRanged={handleUpdateRangedWeapons}
                  onUpdateMelee={handleUpdateMeleeWeapons}
                  onUpdateGrenades={handleUpdateGrenades}
                  shields={character.shields ?? EMPTY_SHIELDS}
                  onUpdateShields={handleUpdateShields}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  archeotech={character.archeotech ?? EMPTY_ARCHAEOTECH}
                  onUpdateArcheotech={handleUpdateArcheotech}
                />
              )}

              {activeTab === "armour" && (
                <MemoizedArmourTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  armour={character.armour}
                  toughnessBonus={getCharBonus("t")}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateArmour}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  archeotech={character.archeotech ?? EMPTY_ARCHAEOTECH}
                  onUpdateArcheotech={handleUpdateArcheotech}
                  traits={character.talentsAndTraits.traits}
                  talents={character.talentsAndTraits}
                  career={character.header.career}
                />
              )}

              {activeTab === "cybernetics" && (
                <CyberneticsTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  rangedWeapons={character.rangedWeapons}
                  meleeWeapons={character.meleeWeapons}
                  strengthBonus={getCharBonus("s")}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateCybernetics}
                  onUpdateRanged={handleUpdateRangedWeapons}
                  onUpdateMelee={handleUpdateMeleeWeapons}
                  archeotech={character.archeotech ?? EMPTY_ARCHAEOTECH}
                  onUpdateArcheotech={handleUpdateArcheotech}
                  career={character.header.career}
                />
              )}

              {activeTab === "psychic" && (
                <PsychicTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  psychic={character.psychic}
                  talents={character.talentsAndTraits}
                  psyRating={psyRating}
                  editable={allowedToEdit}
                  onUpdate={handleUpdatePsychic}
                />
              )}

              {activeTab === "gear" && (
                <GearTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  gear={character.gear}
                  consumables={character.consumables ?? EMPTY_CONSUMABLES}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateGear}
                  onUpdateConsumables={handleUpdateConsumables}
                />
              )}

              {activeTab === "companions" && (
                <CompanionsTab
                  companions={character.companions ?? EMPTY_COMPANIONS}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateCompanions}
                />
              )}

              {activeTab === "drugs" && (
                <DrugsTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  drugs={character.drugs ?? EMPTY_DRUGS}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateDrugs}
                />
              )}

              {activeTab === "xp" && (
                <ExperienceTab
                  campaignId={character.campaignId}
                  character={character}
                  isDM={isDM}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateExperience}
                  onAdjustXp={adjustXp}
                  onUpdateCharacter={patchFieldsWithResult}
                />
              )}

              {activeTab === "notes" && (
                <NotesTab
                  notes={character.notes ?? EMPTY_NOTES}
                  editable={allowedToEdit}
                  onSave={handleUpdateNotes}
                />
              )}

              {activeTab === "background" && (
                <BackgroundTab
                  header={character.header}
                  talents={character.talentsAndTraits}
                  cybernetics={character.cybernetics ?? EMPTY_CYBERNETICS}
                  editable={allowedToEdit}
                  playerName={ownerName}
                  hasLivePlayerName={ownerFirstName !== null}
                  playerNameProfileUnresolved={ownerProfileUnresolved}
                  onUpdateHeader={handleUpdateHeader}
                  onUpdateTalents={handleUpdateTalents}
                  onUpdateCybernetics={handleUpdateCybernetics}
                  gear={character.gear ?? EMPTY_GEAR}
                  onUpdateGear={handleUpdateGear}
                  experience={character.experience}
                  onUpdateExperience={handleUpdateExperience}
                  insanity={character.insanity}
                  onUpdateInsanity={handleUpdateInsanity}
                />
              )}

              {activeTab === "archeotech" && (
                <ArcheotechTab
                  campaignId={path.campaignId}
                  characterId={character.id}
                  userId={effectiveUserId}
                  characterName={character.header.characterName}
                  isDM={isDM}
                  archeotech={character.archeotech ?? EMPTY_ARCHAEOTECH}
                  editable={allowedToEdit}
                  onUpdate={handleUpdateArcheotech}
                />
              )}

              {activeTab === "admin" && isDM && (
                <AdminTab
                  campaignId={path.campaignId}
                  character={character}
                  ownerName={ownerName}
                  onDMForceRelease={dmForceRelease}
                  onDMForceAssign={dmForceAssign}
                  onDMToggleEdit={dmToggleEdit}
                  isDmForceReleasing={isDmForceReleasing}
                  isDmForceAssigning={isDmForceAssigning}
                  isDmTogglingEdit={isDmTogglingEdit}
                  memberIds={memberIds}
                />
              )}
            </Suspense>
            <PendingOverlay active={tabPending} />
          </ErrorBoundary>
        </div>

        {showScrollTop && (
          <IconButton
            label="Scroll to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`fixed bottom-6 right-4 ${uiLayerForeground} h-9 w-9 ${colourFillFloating} shadow-lg`}
            icon={<ChevronUpIcon className="h-5 w-5" />}
          />
        )}
      </div>
    </CampaignCustomItemsScope>
  );
}
