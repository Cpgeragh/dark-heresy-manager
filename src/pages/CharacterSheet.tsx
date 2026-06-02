// src/pages/CharacterSheet.tsx

import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ManageModal } from "../components/ManageModal";
import { CHARACTERISTIC_BONUS_DIVISOR } from "../constants/gameRules";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";
import { ErrorBoundary } from "../components/ErrorBoundary";

import { OverviewTab } from "./characterSheet/OverviewTab";
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
  AmmoItem,
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
import { normaliseArmour, normaliseGear } from "../utils/characterMigration";
import { SectionDrawer } from "../components/SectionDrawer";


// ================================================================
// COMPONENT
// ================================================================

export default function CharacterSheet() {
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
  });

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isManageOpen, setIsManageOpen] = useState(false);

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

  const handleUpdateAmmo = useCallback(
    (next: AmmoItem[]) => updateField("ammo", next),
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
    return (
      <div className="text-slate-300 text-center py-10">
        Invalid character route.
      </div>
    );
  }

  if (characterLoading) {
    return (
      <div className="text-slate-300 text-center py-10">
        Loading character…
      </div>
    );
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

  const containerClass = [
    "border p-4 rounded-lg transition-colors",
    dmOverrideActive
      ? "border-amber-400 bg-amber-500/10"
      : "border-slate-700 bg-slate-900/40",
  ].join(" ");

  return (
    <div>
      {/* HEADER */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Link
            to={isDM ? "/dm" : "/player"}
            className="text-xs px-2 py-1 rounded border bg-slate-900 text-amber-400 border-slate-600 hover:bg-slate-800 shadow-[0_0_8px_rgba(251,191,36,0.35)]"
          >
            Campaign Hub
          </Link>
          <button
            onClick={() => setIsManageOpen(true)}
            className="text-xs px-2 py-1 rounded border bg-slate-900 text-slate-100 border-slate-500 hover:bg-slate-800"
          >
            Manage
          </button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight min-w-0">
            {character.header?.characterName ?? "Unnamed Character"}
          </h1>
        </div>

        <p className="hidden sm:block text-xs text-slate-400 mt-1">
          Campaign: <code>{path.campaignId}</code> — Character ID:{" "}
          <code>{character.id}</code>
        </p>
      </div>

      {/* DM NAV / OVERRIDE BAR */}
      {isDM && (
        <div className="flex items-center justify-between mb-4 p-2 rounded border border-slate-700 bg-slate-900/60">
          <span className="text-xs text-slate-400">
            DM View
          </span>

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

      {/* SECTION DRAWER */}
      <SectionDrawer
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDM={isDM}
      />

      {/* CONTENT CONTAINER */}
      <div 
        className={containerClass}
        role="tabpanel"
        aria-label={`${activeTab} content`}
      >
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
                onClick={() => setActiveTab("overview")}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded border border-slate-700 hover:bg-slate-700 transition"
              >
                Back to Overview
              </button>
            </div>
          }
        >
          {activeTab === "overview" && (
            <OverviewTab
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
              skills={character.skills}
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
              ammo={character.ammo ?? []}
              grenades={character.grenades ?? []}
              editable={allowedToEdit}
              strengthBonus={Math.floor(getCharTotal("s") / CHARACTERISTIC_BONUS_DIVISOR)}
              onUpdateRanged={handleUpdateRangedWeapons}
              onUpdateMelee={handleUpdateMeleeWeapons}
              onUpdateAmmo={handleUpdateAmmo}
              onUpdateGrenades={handleUpdateGrenades}
              shields={character.shields ?? []}
              onUpdateShields={handleUpdateShields}
              cybernetics={character.cybernetics ?? []}
            />
          )}

          {activeTab === "armour" && (
            <ArmourTab
              armour={normaliseArmour(character.armour)}
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
              editable={allowedToEdit}
              onUpdate={handleUpdatePsychic}
            />
          )}

          {activeTab === "gear" && (
            <GearTab
              gear={normaliseGear(character.gear)}
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

      <ManageModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        recoveryCode={character.recoveryCode}
        canExport={isDM || isOwner}
        onExport={() => exportCharacterJson(character)}
        canPlayerRelease={canPlayerRelease}
        onPlayerRelease={releaseCharacter}
        isReleasing={isReleasing}
      />
    </div>
  );
}