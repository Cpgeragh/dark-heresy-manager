// src/pages/CharacterSheet.tsx

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderExtensionSetters } from "../context/HeaderExtensionContext";
import { CharacterKebabContent } from "./characterSheet/CharacterKebabContent";
import { CHARACTERISTIC_BONUS_DIVISOR } from "../constants/gameRules";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";
import { ErrorBoundary } from "../components/ErrorBoundary";

import { VitalsTab } from "./characterSheet/VitalsTab";
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
} from "../types/Character";

import { exportCharacterJson } from "../utils/exportCharacter";
import { normaliseSkills, skillsNeedNormalisation } from "../utils/skillUtils";
import { SectionDrawer } from "../components/SectionDrawer";
import { useUserProfile } from "../hooks/useUserProfile";

// ================================================================
// COMPONENT
// ================================================================

export default function CharacterSheet({ effectiveUserId }: { effectiveUserId: string }) {
  const params = useParams<{ campaignId: string; characterId: string }>();

  const {
    path,
    character,
    characterLoading,
    allowedToEdit,
    isOwner,
    canPlayerRelease,
    claimLog,
    isDM,

    dmReadOnly,
    toggleDmReadOnly,

    getCharField,
    getCharTotal,
    updateCharacteristic,
    updateField,
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
  const { firstName: ownerFirstName } = useUserProfile(character?.userId);
  const ownerName = ownerFirstName ?? character?.header.playerName?.trim() ?? null;
  const normalisedSkills = useMemo(
    () => (character ? normaliseSkills(character.skills) : []),
    [character?.skills]
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
    if (!character) return;

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
    (value: string) => updateField("notes", value),
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

  if (characterLoading) {
    return <div className="text-slate-300 text-center py-10">Loading character…</div>;
  }

  if (!character) {
    return (
      <div className="text-slate-300 text-center py-10 space-y-4">
        <p className="text-lg font-semibold">Character not found.</p>
        <p className="text-sm text-slate-400">
          This character may have been deleted or the link is invalid.
        </p>
      </div>
    );
  }

  // Visual cue for DM override mode
  const dmOverrideActive = isDM && !dmReadOnly;

  const TAB_TITLES: Record<TabId, string> = {
    vitals: "Vitals",
    stats: "Characteristics",
    skills: "Skills",
    talents: "Talents",
    traits: "Traits",
    weapons: "Weapons",
    armour: "Armour",
    cybernetics: "Cybernetics",
    psychic: "Psychic Powers",
    gear: "Gear",
    drugs: "Drugs",
    xp: "Experience",
    notes: "Notes",
    background: "Background",
    archeotech: "Archeotech",
    admin: "Admin",
  };

  const containerClass = [
    "border p-4 rounded-lg transition-colors",
    dmOverrideActive ? "border-amber-400 bg-amber-500/10" : "border-slate-700 bg-slate-900/40",
  ].join(" ");

  return (
    <div>
      {/* DM NAV / OVERRIDE BAR */}
      {isDM && (
        <div className="flex items-center justify-between mb-4 p-2 rounded border border-slate-700 bg-slate-900/60">
          <span className="text-xs text-slate-400">DM View</span>

          <button
            onClick={toggleDmReadOnly}
            aria-label={dmReadOnly ? "Enable editing mode" : "Disable editing mode"}
            aria-pressed={!dmReadOnly}
            className={`text-xs px-3 py-1 rounded border ${
              dmReadOnly
                ? "border-slate-600 bg-slate-800 text-slate-300"
                : "border-amber-400 bg-amber-500 text-slate-900 font-semibold"
            }`}
          >
            {dmReadOnly ? "Read-only" : "Editing enabled"}
          </button>
        </div>
      )}

      {/* NAV BAR */}
      <div className="relative flex items-center mb-4 py-1">
        <SectionDrawer activeTab={activeTab} onTabChange={handleTabChange} isDM={isDM} />
        <span className="absolute inset-x-0 text-center font-semibold text-slate-100 text-lg pointer-events-none">
          {TAB_TITLES[activeTab]}
        </span>
      </div>

      {/* CONTENT CONTAINER */}
      <div className={containerClass} role="tabpanel" aria-label={`${activeTab} content`}>
        <ErrorBoundary
          fallback={
            <div className="p-6 text-center space-y-4">
              <div className="text-slate-300">
                <p className="text-lg font-semibold mb-2">Failed to load this tab</p>
                <p className="text-sm text-slate-400">
                  An error occurred while displaying this content.
                </p>
              </div>
              <button
                onClick={() => handleTabChange("vitals")}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded border border-slate-700 hover:bg-slate-700 transition"
              >
                Back to Overview
              </button>
            </div>
          }
        >
          {activeTab === "vitals" && (
            <VitalsTab
              character={character}
              editable={allowedToEdit}
              onUpdateWounds={handleUpdateWounds}
              onUpdateFate={handleUpdateFate}
              onUpdateInsanity={handleUpdateInsanity}
              onUpdateCorruption={handleUpdateCorruption}
            />
          )}

          {activeTab === "stats" && (
            <CharacteristicsTab
              getCharField={getCharField}
              getCharTotal={getCharTotal}
              editable={allowedToEdit}
              updateCharacteristic={updateCharacteristic}
            />
          )}

          {activeTab === "skills" && (
            <SkillsTab
              skills={normalisedSkills}
              editable={allowedToEdit}
              onUpdate={handleUpdateSkills}
              getCharField={getCharField}
            />
          )}

          {activeTab === "talents" && (
            <TalentsTab
              talents={character.talentsAndTraits}
              weaponTraining={character.weaponTraining}
              editable={allowedToEdit}
              onUpdateTalents={handleUpdateTalents}
              onUpdateTraining={handleUpdateWeaponTraining}
            />
          )}

          {activeTab === "traits" && (
            <TraitsTab
              talents={character.talentsAndTraits}
              editable={allowedToEdit}
              onUpdateTalents={handleUpdateTalents}
            />
          )}

          {activeTab === "weapons" && (
            <WeaponsTab
              rangedWeapons={character.rangedWeapons}
              meleeWeapons={character.meleeWeapons}
              grenades={character.grenades ?? []}
              editable={allowedToEdit}
              strengthBonus={Math.floor(getCharTotal("s") / CHARACTERISTIC_BONUS_DIVISOR)}
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
              armour={character.armour}
              toughnessBonus={Math.floor(getCharTotal("t") / CHARACTERISTIC_BONUS_DIVISOR)}
              editable={allowedToEdit}
              onUpdate={handleUpdateArmour}
              cybernetics={character.cybernetics ?? []}
            />
          )}

          {activeTab === "cybernetics" && (
            <CyberneticsTab
              cybernetics={character.cybernetics ?? []}
              editable={allowedToEdit}
              onUpdate={handleUpdateCybernetics}
            />
          )}

          {activeTab === "psychic" && (
            <PsychicTab
              psychic={character.psychic}
              psyRating={psyRating}
              editable={allowedToEdit}
              onUpdate={handleUpdatePsychic}
            />
          )}

          {activeTab === "gear" && (
            <GearTab
              gear={character.gear}
              consumables={character.consumables ?? []}
              editable={allowedToEdit}
              onUpdate={handleUpdateGear}
              onUpdateConsumables={handleUpdateConsumables}
            />
          )}

          {activeTab === "drugs" && (
            <DrugsTab
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
              isOwnedByCurrentPlayer={isOwner && !isDM}
              isDM={isDM}
              onUpdate={handleUpdateExperience}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={character.notes ?? ""}
              editable={allowedToEdit}
              onSave={handleUpdateNotes}
            />
          )}

          {activeTab === "background" && (
            <BackgroundTab
              header={character.header}
              talents={character.talentsAndTraits}
              editable={allowedToEdit}
              playerName={ownerName}
              onUpdateHeader={handleUpdateHeader}
              onUpdateTalents={handleUpdateTalents}
            />
          )}

          {activeTab === "archeotech" && (
            <ArcheotechTab
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
              campaignId={path.campaignId}
              characterId={character.id}
            />
          )}
        </ErrorBoundary>
      </div>

      {showScrollTop && (
        <button
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
