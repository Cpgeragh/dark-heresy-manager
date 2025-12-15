// src/pages/CharacterSheet.tsx

import { useState } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";

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
import { TabButton } from "../components/TabButton";
import { CharacterBreadcrumb } from "../components/CharacterBreadcrumb";

export default function CharacterSheet() {
  const params = useParams<{ campaignId: string; characterId: string }>();

  const {
    path,
    character,
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
  } = useCharacterSheet({
    campaignIdParam: params.campaignId,
    characterIdParam: params.characterId,
  });

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (!path) {
    return (
      <div className="text-slate-300 text-center py-10">
        Invalid character route.
      </div>
    );
  }

  if (!character) {
    return (
      <div className="text-slate-300 text-center py-10">
        Loading character…
      </div>
    );
  }

  const currentUser = auth.currentUser;
  const isOwner =
    !!(currentUser && character.userId === currentUser.uid);

  const canPlayerRelease = isOwner && !isDM;

  // --------------------------------------------------
  // Visual cue for DM override mode (PR-A10)
  // --------------------------------------------------
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

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
        <TabButton label="Characteristics" active={activeTab === "stats"} onClick={() => setActiveTab("stats")} />
        <TabButton label="Skills" active={activeTab === "skills"} onClick={() => setActiveTab("skills")} />
        <TabButton label="Talents" active={activeTab === "talents"} onClick={() => setActiveTab("talents")} />
        <TabButton label="Weapons" active={activeTab === "weapons"} onClick={() => setActiveTab("weapons")} />
        <TabButton label="Armour" active={activeTab === "armour"} onClick={() => setActiveTab("armour")} />
        <TabButton label="Psychic" active={activeTab === "psychic"} onClick={() => setActiveTab("psychic")} />
        <TabButton label="Gear" active={activeTab === "gear"} onClick={() => setActiveTab("gear")} />
        <TabButton label="XP" active={activeTab === "xp"} onClick={() => setActiveTab("xp")} />
        <TabButton label="Notes" active={activeTab === "notes"} onClick={() => setActiveTab("notes")} />
        {isDM && (
          <TabButton label="Admin" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} />
        )}
      </div>

      {/* CONTENT CONTAINER — VISUAL DIFF WRAP */}
      <div className={containerClass}>
        {activeTab === "overview" && (
          <OverviewTab
            character={character}
            editable={allowedToEdit}
            canPlayerRelease={canPlayerRelease}
            onPlayerRelease={releaseCharacter}
            onUpdateHeader={(next) => updateField("header", next)}
            onUpdateWounds={(next) => updateField("wounds", next)}
            onUpdateFate={(next) => updateField("fate", next)}
            getCharTotal={getCharTotal}
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
            onUpdate={(next) => updateField("skills", next)}
            getCharField={getCharField}
          />
        )}

        {activeTab === "talents" && (
          <TalentsTab
            talents={character.talentsAndTraits}
            weaponTraining={character.weaponTraining}
            editable={allowedToEdit}
            onUpdateTalents={(next) =>
              updateField("talentsAndTraits", next)
            }
            onUpdateTraining={(next) =>
              updateField("weaponTraining", next)
            }
          />
        )}

        {activeTab === "weapons" && (
          <WeaponsTab
            rangedWeapons={character.rangedWeapons}
            meleeWeapons={character.meleeWeapons}
            editable={allowedToEdit}
            onUpdateRanged={(next) =>
              updateField("rangedWeapons", next)
            }
            onUpdateMelee={(next) =>
              updateField("meleeWeapons", next)
            }
          />
        )}

        {activeTab === "armour" && (
          <ArmourTab
            armour={character.armour}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("armour", next)}
          />
        )}

        {activeTab === "psychic" && (
          <PsychicTab
            psychic={character.psychic}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("psychic", next)}
          />
        )}

        {activeTab === "gear" && (
          <GearTab
            gear={character.gear}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("gear", next)}
          />
        )}

        {activeTab === "xp" && (
          <ExperienceTab
            experience={character.experience}
            editable={allowedToEdit}
            onUpdate={(next) =>
              updateField("experience", next)
            }
          />
        )}

        {activeTab === "notes" && (
          <NotesTab
            notes={character.notes ?? ""}
            editable={allowedToEdit}
            onSave={(value) => updateField("notes", value)}
          />
        )}

        {activeTab === "admin" && isDM && (
          <AdminTab
            character={character}
            claimLog={claimLog}
            onDMForceRelease={dmForceRelease}
            onDMForceAssign={dmForceAssign}
            onDMToggleEdit={dmToggleEdit}
          />
        )}
      </div>
    </div>
  );
}