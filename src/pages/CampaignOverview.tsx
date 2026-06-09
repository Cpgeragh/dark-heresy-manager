// src/pages/CampaignOverview.tsx

import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

import { useIsDM } from "../hooks/useIsDM";
import { useCampaign } from "../hooks/useCampaign";
import { useSessions } from "../hooks/useSessions";
import { useCharacterSummaries } from "../hooks/useCharacterSummaries";
import { useCampaignCharacters } from "../hooks/useCampaignCharacters";
import { SessionForm } from "./CampaignOverview/SessionForm";
import { SessionCard } from "./CampaignOverview/SessionCard";
import { CharacterRow } from "./CampaignOverview/CharacterRow";
import { DMInbox } from "./CampaignOverview/DMInbox";
import { applySessionXp } from "../services/sessionService";
import { createNewCharacter, importCharacter } from "../services/characterService";
import { validateCharacterName } from "../utils/validation";
import { useToast } from "../components/Toast";
import { IMPORTANT_TOAST_DURATION } from "../constants/ui";

export default function CampaignOverview() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;

  const isDM = useIsDM(campaignId);
  const { campaign } = useCampaign(campaignId ?? null);
  const { sessions, loading: sessionsLoading, deleteSession, updateSession } = useSessions(campaignId);
  const { characters: summaries, loading } = useCharacterSummaries(campaignId);
  const { characters } = useCampaignCharacters(campaignId ?? null);
  const toast = useToast();

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = useCallback(async () => {
    const name = newCharacterName.trim();
    const validation = validateCharacterName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid character name");
      return;
    }
    if (!campaignId) return;
    try {
      const recoveryCode = await createNewCharacter(campaignId, name);
      toast.success(
        `Character created!\n\nRecovery Code: ${recoveryCode}\n\n(Click the copy button to save this code)`,
        IMPORTANT_TOAST_DURATION,
        recoveryCode
      );
      setNewCharacterName("");
    } catch (err) {
      console.error("Character creation error:", err);
      toast.error("Failed to create character.");
    }
  }, [campaignId, newCharacterName, toast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaignId) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data.recoveryCode !== "string" || typeof data.isEditableByPlayer !== "boolean") {
        toast.error("Invalid character file.");
        return;
      }
      const characterName = await importCharacter(campaignId, data);
      toast.success(`Imported "${characterName}" successfully`, IMPORTANT_TOAST_DURATION);
    } catch (err) {
      console.error("Failed to import character:", err);
      toast.error("Failed to import character. Check the file and try again.");
    }
    e.target.value = "";
  }, [campaignId, toast]);

  if (!campaignId) {
    return <div className="text-slate-300 text-center py-10">No campaign selected.</div>;
  }

  if (loading) {
    return <div className="text-slate-300 text-center py-10">Loading campaign...</div>;
  }

  const filteredCharacters = search.trim()
    ? characters.filter((c) =>
        (c.header?.characterName ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : characters;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{campaign?.name ?? "Campaign Overview"}</h1>
        {isDM && !showSessionForm && (
          <button
            onClick={() => setShowSessionForm(true)}
            className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm"
          >
            New Session
          </button>
        )}
      </div>

      {isDM && showSessionForm && (
        <SessionForm
          campaignId={campaignId}
          characters={summaries}
          onClose={() => setShowSessionForm(false)}
        />
      )}

      {/* CHARACTERS */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold">Characters</h2>
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm w-48"
          />
        </div>

        {/* DM create / import */}
        {isDM && (
          <div className="flex gap-2 mb-4">
            <input
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded w-56 text-sm"
              placeholder="Character Name"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm"
            >
              Create
            </button>
            <label className="px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded text-sm cursor-pointer hover:bg-slate-600">
              Import JSON
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        )}

        <div className="space-y-4">
          {filteredCharacters.length === 0 ? (
            <p className="text-slate-400 text-sm">
              {search.trim() ? `No characters match "${search}".` : "No characters yet."}
            </p>
          ) : (
            filteredCharacters.map((char) => (
              <CharacterRow
                key={char.id}
                campaignId={campaignId}
                characterId={char.id}
                characterName={char.header?.characterName ?? "Unnamed Character"}
                userId={char.userId ?? null}
                recoveryCode={char.recoveryCode}
                isDM={isDM}
              />
            ))
          )}
        </div>
      </div>

      {/* MESSAGES */}
      {isDM && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Messages</h2>
          <DMInbox
            campaignId={campaignId}
            dmUid={campaign?.dmId ?? ""}
            characters={characters}
          />
        </div>
      )}

      {/* SESSION HISTORY */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Session History</h2>
        {sessionsLoading ? (
          <p className="text-slate-400 text-sm">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-slate-400 text-sm">No sessions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                characters={summaries}
                isDM={isDM}
                onDelete={isDM ? () => deleteSession(session.id) : undefined}
                onSave={isDM ? (data) => updateSession(session.id, data) : undefined}
                onApplyXp={
                  isDM
                    ? () => applySessionXp(campaignId, session.id, session.attendees, session.xpAwarded)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
