// src/pages/CharacterSheet.tsx

import { useState } from "react";
import { useParams } from "react-router-dom";
import type { User } from "firebase/auth";

import { useCharacterSheet } from "./characterSheet/useCharacterSheet";
import { OverviewTab } from "./characterSheet/OverviewTab";
import { CharacteristicsTab } from "./characterSheet/CharacteristicsTab";
import { NotesTab } from "./characterSheet/NotesTab";
import { AdminTab } from "./characterSheet/AdminTab";
import type { TabId } from "./characterSheet/types";
import { TabButton } from "../components/TabButton";

type Role = "player" | "dm";

type Props = {
  user: User;
  role: Role;
};

export default function CharacterSheet({ user, role }: Props) {
  const params = useParams<{ campaignId: string; characterId: string }>();

  const {
    path,
    character,
    allowedToEdit,
    claimLog,
    isDM,
    getCharField,
    updateCharacteristic,
    updateField,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,
  } = useCharacterSheet({
    user,
    role,
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

  const isOwner = character.userId === user.uid;
  const canPlayerRelease = isOwner && !isDM;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">{character.name}</h1>
      <p className="text-xs text-slate-400 mb-4">
        Campaign: <code>{path.campaignId}</code> — Character ID:{" "}
        <code>{character.id}</code>
      </p>

      {/* Tabs */}
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

      {/* Content */}
      <div className="border border-slate-700 p-4 rounded-lg bg-slate-900/40">
        {activeTab === "overview" && (
          <OverviewTab
            character={character}
            canPlayerRelease={canPlayerRelease}
            onPlayerRelease={releaseCharacter}
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
          <div className="text-slate-300">Skills tab placeholder.</div>
        )}

        {activeTab === "talents" && (
          <div className="text-slate-300">Talents tab placeholder.</div>
        )}

        {activeTab === "gear" && (
          <div className="text-slate-300">Gear tab placeholder.</div>
        )}

        {activeTab === "xp" && (
          <div className="text-slate-300">XP tab placeholder.</div>
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