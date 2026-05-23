// src/pages/CharacterSheet.tsx

import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";
import { ErrorBoundary } from "../components/ErrorBoundary";

import { OverviewTab } from "./characterSheet/OverviewTab";
import { CharacteristicsTab } from "./characterSheet/CharacteristicsTab";
import { SkillsTab } from "./characterSheet/tabs/skills/SkillsTab";
import { TalentsTab } from "./characterSheet/TalentsTab";
import { WeaponsTab } from "./characterSheet/WeaponsTab";
import { ArmourTab } from "./characterSheet/ArmourTab";
import { PsychicTab } from "./characterSheet/PsychicTab";
import { GearTab } from "./characterSheet/GearTab";
import { ExperienceTab } from "./characterSheet/ExperienceTab";
import { NotesTab } from "./characterSheet/NotesTab";
import { AdminTab } from "./characterSheet/AdminTab";

import type { TabId } from "./characterSheet/types";
import type {
  CharacterHeader,
  WoundsBlock,
  FateBlock,
  SkillEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  RangedWeapon,
  MeleeWeapon,
  ArmourBlock,
  PsychicBlock,
  ExperienceBlock,
} from "../types/Character";
import { TabButton } from "../components/TabButton";
import { CharacterBreadcrumb } from "../components/CharacterBreadcrumb";

// ================================================================
// TAB CONFIGURATION
// ================================================================

interface TabConfig {
  id: TabId;
  label: string;
  dmOnly?: boolean;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview" },
  { id: "stats", label: "Characteristics" },
  { id: "skills", label: "Skills" },
  { id: "talents", label: "Talents" },
  { id: "weapons", label: "Weapons" },
  { id: "armour", label: "Armour" },
  { id: "psychic", label: "Psychic" },
  { id: "gear", label: "Gear" },
  { id: "xp", label: "XP" },
  { id: "notes", label: "Notes" },
  { id: "admin", label: "Admin", dmOnly: true },
];

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
    (next: ArmourBlock) => updateField("armour", next),
    [updateField]
  );

  const handleUpdatePsychic = useCallback(
    (next: PsychicBlock) => updateField("psychic", next),
    [updateField]
  );

  const handleUpdateGear = useCallback(
    (next: string[]) => updateField("gear", next),
    [updateField]
  );

  const handleUpdateExperience = useCallback(
    (next: ExperienceBlock) => updateField("experience", next),
    [updateField]
  );

  const handleUpdateNotes = useCallback(
    (value: string) => updateField("notes", value),
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

  const currentUser = auth.currentUser;
  const isOwner =
    !!(currentUser && character.userId === currentUser.uid);

  const canPlayerRelease = isOwner && !isDM;

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
      {/* SHARED BREADCRUMB */}
      <CharacterBreadcrumb isDM={isDM} />

      {/* HEADER */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-1">
          {character.header?.characterName ?? "Unnamed Character"}
        </h1>

        <p className="text-xs text-slate-400">
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

      {/* TABS - NOW USING CONFIGURATION */}
      <div 
        className="flex flex-wrap gap-2 mb-6"
        role="tablist"
        aria-label="Character sheet sections"
      >
        {TABS.map((tab) => {
          // Skip DM-only tabs if not DM
          if (tab.dmOnly && !isDM) return null;

          return (
            <TabButton
              key={tab.id}
              label={tab.label}
              tabId={tab.id}
              active={activeTab === tab.id}
              onTabChange={setActiveTab}
            />
          );
        })}
      </div>

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
              canPlayerRelease={canPlayerRelease}
              onPlayerRelease={releaseCharacter}
              onUpdateHeader={handleUpdateHeader}
              onUpdateWounds={handleUpdateWounds}
              onUpdateFate={handleUpdateFate}
              getCharTotal={getCharTotal}
              isReleasing={isReleasing}
            />
          )}

          {activeTab === "stats" && (
            <CharacteristicsTab
              getCharField={getCharField}
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

          {activeTab === "weapons" && (
            <WeaponsTab
              rangedWeapons={character.rangedWeapons}
              meleeWeapons={character.meleeWeapons}
              editable={allowedToEdit}
              onUpdateRanged={handleUpdateRangedWeapons}
              onUpdateMelee={handleUpdateMeleeWeapons}
            />
          )}

          {activeTab === "armour" && (
            <ArmourTab
              armour={character.armour}
              editable={allowedToEdit}
              onUpdate={handleUpdateArmour}
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
              gear={character.gear}
              editable={allowedToEdit}
              onUpdate={handleUpdateGear}
            />
          )}

          {activeTab === "xp" && (
            <ExperienceTab
              experience={character.experience}
              editable={allowedToEdit}
              onUpdate={handleUpdateExperience}
              campaignId={path.campaignId}
              characterId={character.id}
              isOwnedByCurrentPlayer={isOwner && !isDM}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={character.notes ?? ""}
              editable={allowedToEdit}
              onSave={handleUpdateNotes}
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
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}