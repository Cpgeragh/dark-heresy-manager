// src/pages/CharacterSheet.tsx

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderExtensionSetters } from "../context/useHeaderExtension";
import { CharacterKebabContent } from "./characterSheet/CharacterKebabContent";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Button } from "../ui/Button";

import { VitalsTab } from "./characterSheet/VitalsTab";
import { InsanityTab } from "./characterSheet/InsanityTab";
import { CorruptionTab } from "./characterSheet/CorruptionTab";
import { CharacteristicsTab } from "./characterSheet/CharacteristicsTab";
import { SkillsTab } from "./characterSheet/SkillsTab";
import { TalentsTab } from "./characterSheet/TalentsTab";
import { TraitsTab } from "./characterSheet/TraitsTab";
import { WeaponsTab } from "./characterSheet/WeaponsTab";
import { ArmourTab } from "./characterSheet/ArmourTab";
import { CyberneticsTab } from "./characterSheet/CyberneticsTab";
import { PsychicTab } from "./characterSheet/PsychicTab";
import { GearTab } from "./characterSheet/GearTab";
import { DrugsTab } from "./characterSheet/DrugsTab";
import { ExperienceTab } from "./characterSheet/ExperienceTab";
import { NotesTab } from "./characterSheet/NotesTab";
import { AdminTab } from "./characterSheet/AdminTab";
import { ArcheotechTab } from "./characterSheet/ArcheotechTab";
import { BackgroundTab } from "./characterSheet/BackgroundTab";
import { WeaponTrainingTab } from "./characterSheet/WeaponTrainingTab";
import { CompanionsTab } from "./characterSheet/CompanionsTab";

import type { TabId } from "./characterSheet/types";
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
import { getSpentXp } from "../features/experience/xpSpent";
import { normaliseSkills, skillsNeedNormalisation } from "../utils/skillUtils";
import { SectionDrawer } from "../components/SectionDrawer";
import { useUserProfile } from "../hooks/useUserProfile";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";

// ================================================================
// COMPONENT
// ================================================================

export default function CharacterSheet({
  effectiveUserId,
  onOpenMessages,
}: {
  effectiveUserId: string;
  onOpenMessages: () => void;
}) {
  const params = useParams<{ campaignId: string; characterId: string }>();

  const {
    path,
    character,
    characterLoading,
    characterError,
    allowedToEdit,
    isOwner,
    canPlayerRelease,
    claimLog,
    isDM,
    isDMLoading,
    memberIds,

    dmReadOnly,
    toggleDmReadOnly,

    getCharField,
    getEffectiveCharTotal,
    getCharBonus,
    updateCharacteristic,
    updateField,
    updateFields,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,

    // Loading states
    isReleasing,
    isDmForceReleasing,
    isDmForceAssigning,
    isDmTogglingEdit,
  } = useCharacterSheet({
    campaignIdParam: params.campaignId,
    characterIdParam: params.characterId,
    effectiveUserId,
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) ?? "stats";

  // The owner's player name is derived live from their public profile so it
  // stays in sync with their account first name (falls back to the legacy
  // header.playerName for characters claimed before profiles existed).
  const { firstName: ownerFirstName, error: ownerProfileError } = useUserProfile(
    character?.userId
  );
  const ownerName = ownerFirstName ?? character?.header.playerName?.trim() ?? null;
  const hasCharacter = Boolean(character);
  const savedSkills = character?.skills;
  const normalisedSkills = useMemo(
    () => (hasCharacter ? normaliseSkills(savedSkills) : []),
    [hasCharacter, savedSkills]
  );

  const psyRating = useMemo(
    () =>
      (character?.talentsAndTraits.talents ?? []).reduce((max, entry) => {
        const match = entry.talentId.match(/^psy-rating-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0),
    [character?.talentsAndTraits.talents]
  );

  useEffect(() => {
    if (!character || !allowedToEdit) return;
    if (skillsNeedNormalisation(character.skills, normalisedSkills)) {
      updateField("skills", normalisedSkills);
    }
  }, [character, allowedToEdit, normalisedSkills, updateField]);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      navigate(`?tab=${tab}`);
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [navigate]
  );

  const basePath = `/campaign/${params.campaignId}/character/${params.characterId}`;

  // New characters must finish Background (Homeworld, Career, Rank) before a
  // player can leave it. DM browsing is never gated. Once complete, this
  // never re-locks even if a field is cleared later, since it checks the
  // persisted flag first.
  const backgroundSatisfied = character ? isBackgroundComplete(character) : true;

  useEffect(() => {
    if (!character || character.backgroundComplete || !backgroundSatisfied) return;
    updateField("backgroundComplete", true);
  }, [character, backgroundSatisfied, updateField]);

  useEffect(() => {
    if (!character || isDM || backgroundSatisfied) return;
    if (activeTab !== "background") {
      navigate(`${basePath}?tab=background`, { replace: true });
    }
  }, [character, isDM, backgroundSatisfied, activeTab, basePath, navigate]);

  // Single source of truth for experience.spent — recalculated from what's
  // actually owned (manual advances, Characteristic Advances, and later
  // Skills/Talents/Traits) and written here only, so nothing else ever needs
  // to compute or save this number itself.
  useEffect(() => {
    if (!character || !allowedToEdit) return;
    const computedSpent = getSpentXp(character);
    if (character.experience.spent === computedSpent) return;
    updateField("experience", { ...character.experience, spent: computedSpent });
  }, [character, allowedToEdit, updateField]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      const onCharSheet = window.location.pathname.startsWith(basePath);
      const atFloor = onCharSheet && !window.location.search.includes("tab=");

      if (!onCharSheet) {
        // Safety net — redirect back if somehow the sentinel was exhausted
        navigate(`${basePath}?tab=stats`, { replace: true });
      } else if (atFloor) {
        // Hit the floor (stats, no tab param) — replenish the sentinel
        window.history.pushState(null, "", window.location.href);
      }
      // Tab-to-tab back navigation — do nothing, works normally
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

  useEffect(() => {
    if (!character || isDMLoading) return;

    setBackHref(isDM ? "/dm" : "/player");

    setKebabContent(
      <CharacterKebabContent
        recoveryCode={character.recoveryCode}
        canExport={isDM || isOwner}
        onExport={() => exportCharacterJson(character)}
        canPlayerRelease={canPlayerRelease}
        onPlayerRelease={releaseCharacter}
        isReleasing={isReleasing}
      />
    );

    return () => {
      clearBackHref();
      clearKebabContent();
    };
  }, [
    character,
    isDM,
    isDMLoading,
    isOwner,
    canPlayerRelease,
    releaseCharacter,
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
    (next: CharacterHeader) => updateField("header", next),
    [updateField]
  );

  const handleUpdateWounds = useCallback(
    (next: WoundsBlock) => updateField("wounds", next),
    [updateField]
  );

  const handleUpdateFate = useCallback(
    (next: FateBlock) => updateField("fate", next),
    [updateField]
  );

  const handleUpdateInsanity = useCallback(
    (next: InsanityBlock) => updateField("insanity", next),
    [updateField]
  );

  const handleUpdateCorruption = useCallback(
    (next: CorruptionBlock) => updateField("corruption", next),
    [updateField]
  );

  const handleUpdateSkills = useCallback(
    (next: SkillEntry[]) => updateField("skills", next),
    [updateField]
  );

  const handleUpdateTalents = useCallback(
    (next: TalentsAndTraitsBlock) => updateField("talentsAndTraits", next),
    [updateField]
  );

  const handleUpdateWeaponTraining = useCallback(
    (next: WeaponTrainingBlock) => updateField("weaponTraining", next),
    [updateField]
  );

  const handleUpdateRangedWeapons = useCallback(
    (next: RangedWeapon[]) => updateField("rangedWeapons", next),
    [updateField]
  );

  const handleUpdateMeleeWeapons = useCallback(
    (next: MeleeWeapon[]) => updateField("meleeWeapons", next),
    [updateField]
  );

  const handleUpdateArmour = useCallback(
    (next: WornArmourPiece[]) => updateField("armour", next),
    [updateField]
  );

  const handleUpdatePsychic = useCallback(
    (next: PsychicBlock) => updateField("psychic", next),
    [updateField]
  );

  const handleUpdateGear = useCallback(
    (next: GearItem[]) => updateField("gear", next),
    [updateField]
  );

  const handleUpdateCompanions = useCallback(
    (next: CompanionItem[]) => updateField("companions", next),
    [updateField]
  );

  const handleUpdateConsumables = useCallback(
    (next: ConsumableItem[]) => updateField("consumables", next),
    [updateField]
  );

  const handleUpdateDrugs = useCallback(
    (next: DrugItem[]) => updateField("drugs", next),
    [updateField]
  );

  const handleUpdateGrenades = useCallback(
    (next: GrenadeItem[]) => updateField("grenades", next),
    [updateField]
  );

  const handleUpdateShields = useCallback(
    (next: ShieldItem[]) => updateField("shields", next),
    [updateField]
  );

  const handleUpdateCybernetics = useCallback(
    (next: CyberneticItem[]) => updateField("cybernetics", next),
    [updateField]
  );

  const handleUpdateNotes = useCallback(
    (value: string | NoteEntry[]) => updateField("notes", value),
    [updateField]
  );

  const handleUpdateExperience = useCallback(
    (next: ExperienceBlock) => updateField("experience", next),
    [updateField]
  );

  const handleUpdateArcheotech = useCallback(
    (next: ArcheotechItem[]) => updateField("archeotech", next),
    [updateField]
  );

  // ================================================================
  // RENDERING LOGIC
  // ================================================================

  if (!path) {
    return <div className="text-slate-300 text-center py-10">Invalid character route.</div>;
  }

  if (characterLoading || isDMLoading) {
    return <LoadingState className="text-center py-10">Loading character…</LoadingState>;
  }

  if (characterError) {
    return (
      <ErrorState className="text-center py-10">
        Unable to load this character. Please refresh the page.
      </ErrorState>
    );
  }

  if (!character) {
    return (
      <div className="text-slate-300 text-center py-10 space-y-4">
        <p className="text-lg font-semibold">Character not found.</p>
        <p className="text-sm lg:text-base text-slate-400">
          This character may have been deleted or the link is invalid.
        </p>
      </div>
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

  const containerClass = [
    "border p-4 lg:p-5 rounded-lg transition-colors",
    dmOverrideActive ? "border-amber-400 bg-amber-500/10" : "border-slate-700 bg-slate-900/40",
  ].join(" ");

  return (
    <div>
      {ownerProfileError && (
        <p className="mb-4 text-sm lg:text-base text-amber-300">
          Unable to refresh the owner&apos;s profile name; showing the stored name.
        </p>
      )}

      {/* DM NAV / OVERRIDE BAR */}
      {isDM && (
        <div className="flex items-center justify-between mb-4 p-2 rounded border border-slate-700 bg-slate-900/60">
          <span className="text-xs lg:text-sm text-slate-400">DM View</span>

          <button type="button"
            onClick={toggleDmReadOnly}
            aria-label={dmReadOnly ? "Enable editing mode" : "Disable editing mode"}
            aria-pressed={!dmReadOnly}
            className={`text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border ${
              dmReadOnly
                ? "border-slate-600 bg-slate-800 text-slate-300"
                : "border-amber-400 bg-amber-500 text-slate-900 font-semibold"
            }`}
          >
            {dmReadOnly ? "Read-only" : "Editing enabled"}
          </button>
        </div>
      )}

      {/* Balanced page toolbar: navigation, centred title, matching spacer */}
      <div className="mb-4 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center rounded-lg border border-slate-700 bg-slate-900/60 p-2">
        {(isDM || backgroundSatisfied) && (
          <SectionDrawer
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isDM={isDM}
          />
        )}
        <h1 className="px-2 text-center font-cinzel text-sm font-bold leading-tight text-red-500 sm:text-base lg:text-lg">
          {TAB_TITLES[activeTab]}
        </h1>
        <button
          type="button"
          onClick={onOpenMessages}
          aria-label="Messages"
          className="flex h-10 w-11 items-center justify-center justify-self-end rounded-lg border border-slate-500 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        </button>
      </div>

      {/* CONTENT CONTAINER */}
      <div className={containerClass} role="tabpanel" aria-label={`${activeTab} content`}>
        <ErrorBoundary
          fallback={
            <div className="p-6 text-center space-y-4">
              <div className="text-slate-300">
                <p className="text-lg font-semibold mb-2">Failed to load this tab</p>
                <p className="text-sm lg:text-base text-slate-400">
                  An error occurred while displaying this content.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleTabChange("vitals")}
              >
                Back to Overview
              </Button>
            </div>
          }
        >
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
            <CharacteristicsTab
              getCharField={getCharField}
              getEffectiveCharTotal={getEffectiveCharTotal}
              getCharBonus={getCharBonus}
              editable={allowedToEdit}
              corruption={character.corruption}
              talents={character.talentsAndTraits}
              career={character.header.career}
              updateCharacteristic={updateCharacteristic}
            />
          )}

          {activeTab === "skills" && (
            <SkillsTab
              skills={normalisedSkills}
              editable={allowedToEdit}
              onUpdate={handleUpdateSkills}
              getCharField={getCharField}
              corruption={character.corruption}
              talents={character.talentsAndTraits}
              career={character.header.career}
              rank={character.header.rank}
              isDM={isDM}
            />
          )}

          {activeTab === "talents" && (
            <TalentsTab
              talents={character.talentsAndTraits}
              career={character.header.career}
              rank={character.header.rank}
              psychic={character.psychic}
              cybernetics={character.cybernetics ?? []}
              rangedWeapons={character.rangedWeapons}
              meleeWeapons={character.meleeWeapons}
              archeotech={character.archeotech ?? []}
              insanity={character.insanity}
              willpowerBonus={getCharBonus("wp")}
              weaponTraining={character.weaponTraining}
              editable={allowedToEdit}
              onUpdateTalents={handleUpdateTalents}
              onUpdateCharacter={updateFields}
            />
          )}

          {activeTab === "training" && (
            <WeaponTrainingTab
              weaponTraining={character.weaponTraining}
              talents={character.talentsAndTraits}
              career={character.header.career}
              rank={character.header.rank}
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
              cybernetics={character.cybernetics ?? []}
              gear={character.gear ?? []}
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
              grenades={character.grenades ?? []}
              editable={allowedToEdit}
              strengthBonus={getCharBonus("s")}
              onUpdateRanged={handleUpdateRangedWeapons}
              onUpdateMelee={handleUpdateMeleeWeapons}
              onUpdateGrenades={handleUpdateGrenades}
              shields={character.shields ?? []}
              onUpdateShields={handleUpdateShields}
              cybernetics={character.cybernetics ?? []}
              archeotech={character.archeotech ?? []}
              onUpdateArcheotech={handleUpdateArcheotech}
            />
          )}

          {activeTab === "armour" && (
            <ArmourTab
              campaignId={path.campaignId}
              characterId={character.id}
              userId={effectiveUserId}
              characterName={character.header.characterName}
              isDM={isDM}
              armour={character.armour}
              toughnessBonus={getCharBonus("t")}
              editable={allowedToEdit}
              onUpdate={handleUpdateArmour}
              cybernetics={character.cybernetics ?? []}
              archeotech={character.archeotech ?? []}
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
              cybernetics={character.cybernetics ?? []}
              rangedWeapons={character.rangedWeapons}
              meleeWeapons={character.meleeWeapons}
              strengthBonus={getCharBonus("s")}
              editable={allowedToEdit}
              onUpdate={handleUpdateCybernetics}
              onUpdateRanged={handleUpdateRangedWeapons}
              onUpdateMelee={handleUpdateMeleeWeapons}
              archeotech={character.archeotech ?? []}
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
              consumables={character.consumables ?? []}
              editable={allowedToEdit}
              onUpdate={handleUpdateGear}
              onUpdateConsumables={handleUpdateConsumables}
            />
          )}

          {activeTab === "companions" && (
            <CompanionsTab
              companions={character.companions ?? []}
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
              drugs={character.drugs ?? []}
              editable={allowedToEdit}
              onUpdate={handleUpdateDrugs}
            />
          )}

          {activeTab === "xp" && (
            <ExperienceTab
              experience={character.experience}
              campaignId={path.campaignId}
              characterId={character.id}
              isDM={isDM}
              onUpdate={handleUpdateExperience}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={character.notes ?? []}
              editable={allowedToEdit}
              onSave={handleUpdateNotes}
            />
          )}

          {activeTab === "background" && (
            <BackgroundTab
              header={character.header}
              talents={character.talentsAndTraits}
              cybernetics={character.cybernetics ?? []}
              editable={allowedToEdit}
              playerName={ownerName}
              onUpdateHeader={handleUpdateHeader}
              onUpdateTalents={handleUpdateTalents}
              onUpdateCybernetics={handleUpdateCybernetics}
              gear={character.gear ?? []}
              onUpdateGear={handleUpdateGear}
            />
          )}

          {activeTab === "archeotech" && (
            <ArcheotechTab
              campaignId={path.campaignId}
              characterId={character.id}
              userId={effectiveUserId}
              characterName={character.header.characterName}
              isDM={isDM}
              archeotech={character.archeotech ?? []}
              editable={allowedToEdit}
              onUpdate={handleUpdateArcheotech}
            />
          )}

          {activeTab === "admin" && isDM && (
            <AdminTab
              character={character}
              ownerName={ownerName}
              claimLog={claimLog}
              onDMForceRelease={dmForceRelease}
              onDMForceAssign={dmForceAssign}
              onDMToggleEdit={dmToggleEdit}
              isDmForceReleasing={isDmForceReleasing}
              isDmForceAssigning={isDmForceAssigning}
              isDmTogglingEdit={isDmTogglingEdit}
              memberIds={memberIds}
            />
          )}
        </ErrorBoundary>
      </div>

      {showScrollTop && (
        <button type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-4 z-50 w-9 h-9 rounded bg-slate-800/85 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-slate-700/90 transition shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
