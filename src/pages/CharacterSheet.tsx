// src/pages/CharacterSheet.tsx

import { useState } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";

import { OverviewTab } from "./characterSheet/OverviewTab";
import { CharacteristicsTab } from "./characterSheet/CharacteristicsTab";
import { NotesTab } from "./characterSheet/NotesTab";
import { AdminTab } from "./characterSheet/AdminTab";

import { SkillsTab } from "./characterSheet/tabs/skills/SkillsTab";
import { TalentsTab } from "./characterSheet/TalentsTab";
import { GearTab } from "./characterSheet/GearTab";
import { ExperienceTab } from "./characterSheet/ExperienceTab";

import { WeaponsTab } from "./characterSheet/WeaponsTab";
import { ArmourTab } from "./characterSheet/ArmourTab";

import type { TabId } from "./characterSheet/types";
import { TabButton } from "../components/TabButton";

export default function CharacterSheet() {
  const params = useParams<{ campaignId: string; characterId: string }>();

  const {
    path,
    character,
    allowedToEdit,
    claimLog,
    isDM,
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
  const isOwner = !!(currentUser && character.userId === currentUser.uid);
  const canPlayerRelease = isOwner && !isDM;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">
        {character.header?.characterName ?? "Unnamed Character"}
      </h1>

      <p className="text-xs text-slate-400 mb-4">
        Campaign: <code>{path.campaignId}</code> — Character ID:{" "}
        <code>{character.id}</code>
      </p>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />

        <TabButton
          label="Characteristics"
          active={activeTab === "stats"}
          onClick={() => setActiveTab("stats")}
        />

        <TabButton
          label="Skills"
          active={activeTab === "skills"}
          onClick={() => setActiveTab("skills")}
        />

        <TabButton
          label="Talents"
          active={activeTab === "talents"}
          onClick={() => setActiveTab("talents")}
        />

        <TabButton
          label="Weapons"
          active={activeTab === "weapons"}
          onClick={() => setActiveTab("weapons")}
        />

        <TabButton
          label="Armour"
          active={activeTab === "armour"}
          onClick={() => setActiveTab("armour")}
        />

        <TabButton
          label="Gear"
          active={activeTab === "gear"}
          onClick={() => setActiveTab("gear")}
        />

        <TabButton
          label="XP"
          active={activeTab === "xp"}
          onClick={() => setActiveTab("xp")}
        />

        <TabButton
          label="Notes"
          active={activeTab === "notes"}
          onClick={() => setActiveTab("notes")}
        />

        {isDM && (
          <TabButton
            label="Admin"
            active={activeTab === "admin"}
            onClick={() => setActiveTab("admin")}
          />
        )}
      </div>

      {/* CONTENT */}
      <div className="border border-slate-700 p-4 rounded-lg bg-slate-900/40">
        {/* OVERVIEW */}
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

        {/* CHARACTERISTICS */}
        {activeTab === "stats" && (
          <CharacteristicsTab
            getCharField={getCharField}
            editable={allowedToEdit}
            updateCharacteristic={updateCharacteristic}
          />
        )}

        {/* SKILLS */}
        {activeTab === "skills" && (
          <SkillsTab
            skills={character.skills}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("skills", next)}
            getCharField={getCharField}
          />
        )}

        {/* TALENTS */}
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

        {/* WEAPONS */}
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

        {/* ARMOUR */}
        {activeTab === "armour" && (
          <ArmourTab
            armour={character.armour}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("armour", next)}
          />
        )}

        {/* GEAR */}
        {activeTab === "gear" && (
          <GearTab
            gear={character.gear}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("gear", next)}
          />
        )}

        {/* EXPERIENCE */}
        {activeTab === "xp" && (
          <ExperienceTab
            experience={character.experience}
            editable={allowedToEdit}
            onUpdate={(next) => updateField("experience", next)}
          />
        )}

        {/* NOTES */}
        {activeTab === "notes" && (
          <NotesTab
            notes={character.notes ?? ""}
            editable={allowedToEdit}
            onSave={(value) => updateField("notes", value)}
          />
        )}

        {/* ADMIN */}
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