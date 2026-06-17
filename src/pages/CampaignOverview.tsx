// src/pages/CampaignOverview.tsx

import { useState, useCallback, useEffect } from "react";
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
import { editableInputClass } from "../ui/editableStyles";
import { Button } from "../ui/Button";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { useHeaderExtensionSetters } from "../context/HeaderExtensionContext";

export default function CampaignOverview({ effectiveUserId }: { effectiveUserId: string }) {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;

  const isDM = useIsDM(campaignId, effectiveUserId);
  const { campaign } = useCampaign(campaignId ?? null);
  const { sessions, loading: sessionsLoading, deleteSession, updateSession } = useSessions(campaignId);
  const { characters: summaries, loading } = useCharacterSummaries(campaignId);
  const { characters } = useCampaignCharacters(campaignId ?? null);
  const toast = useToast();
  const { setKebabContent, clearKebabContent } = useHeaderExtensionSetters();

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");

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

  // Inject Import JSON into header kebab for DMs
  useEffect(() => {
    if (!isDM) {
      clearKebabContent();
      return;
    }
    setKebabContent(
      <div className="space-y-2">
        <p className="text-xs lg:text-sm font-semibold text-slate-100 uppercase tracking-wide">Character Data</p>
        <label className="block px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm rounded bg-slate-700 border border-slate-500 text-slate-100 hover:bg-slate-600 cursor-pointer">
          Import JSON
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    );
    return () => clearKebabContent();
  }, [isDM, handleImport, setKebabContent, clearKebabContent]);

  if (!campaignId) {
    return <div className="text-slate-300 text-center py-10">No campaign selected.</div>;
  }

  if (loading || isDM === null) {
    return <div className="text-slate-300 text-center py-10">Loading campaign…</div>;
  }

  const filteredCharacters = search.trim()
    ? characters.filter((c) =>
        (c.header?.characterName ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : characters;

  return (
    <PageShell title={campaign?.name ?? "Campaign Overview"}>
      <Panel>
        {/* Session form — shown inline when creating */}
        {isDM && showSessionForm && (
          <SessionForm
            campaignId={campaignId}
            characters={summaries}
            onClose={() => setShowSessionForm(false)}
          />
        )}

        {/* CHARACTERS */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <SectionHeader>Characters</SectionHeader>
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={editableInputClass(true) + " w-full sm:w-36 lg:w-48 text-xs lg:text-sm py-1 lg:py-1.5"}
            />
          </div>

          {isDM && (
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                className={editableInputClass(true) + " flex-1"}
                placeholder="Character Name"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
              />
              <Button onClick={handleCreate}>Create</Button>
            </div>
          )}

          <div className="space-y-3">
            {filteredCharacters.length === 0 ? (
              <p className="text-slate-400 text-sm lg:text-base">
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
                  portraitUrl={char.portraitUrl}
                  isDM={isDM}
                />
              ))
            )}
          </div>
        </div>

        {/* MESSAGES — DM only */}
        {isDM && (
          <div>
            <SectionHeader className="mb-3">Messages</SectionHeader>
            <DMInbox
              campaignId={campaignId}
              dmUid={campaign?.dmId ?? ""}
              characters={characters}
            />
          </div>
        )}

        {/* SESSION HISTORY */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <SectionHeader>Session History</SectionHeader>
            {isDM && !showSessionForm && (
              <Button className="w-full sm:w-auto" onClick={() => setShowSessionForm(true)}>
                New Session
              </Button>
            )}
          </div>

          {sessionsLoading ? (
            <p className="text-slate-400 text-sm lg:text-base">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-slate-400 text-sm lg:text-base">No sessions recorded yet.</p>
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
      </Panel>
    </PageShell>
  );
}
