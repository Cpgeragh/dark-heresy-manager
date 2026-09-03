// src/pages/CampaignOverview.tsx

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";

import { useCampaign } from "../hooks/useCampaign";
import { useSessions } from "../hooks/useSessions";
import { useCampaignCharacters } from "../hooks/useCampaignCharacters";
import { SessionForm } from "./CampaignOverview/SessionForm";
import { SessionCard } from "./CampaignOverview/SessionCard";
import { CharacterRow } from "./CampaignOverview/CharacterRow";
import { DMInbox } from "./CampaignOverview/DMInbox";
import { CustomItemLibraryAdmin } from "./CampaignOverview/CustomItemLibraryAdmin";
import { applySessionXp, repairSessionSummaries } from "../services/sessionService";
import {
  createNewCharacter,
  importCharacter,
  repairCharacterSummaries,
} from "../services/characterService";
import { validateCharacterName } from "../utils/validation";
import { readCharacterImportFile } from "../firestore/firebaseValidation";
import { useToast } from "../components/Toast";
import { IMPORTANT_TOAST_DURATION } from "../constants/ui";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { editableInputClass, uiSubheading, uiTextLabel } from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";
import { useHeaderExtensionSetters } from "../context/useHeaderExtension";
import { useCampaignCharacterSummaries } from "../hooks/useCampaignCharacterSummaries";
import { MyCharacterCard } from "./CampaignOverview/MyCharacterCard";
import { PartyRosterTile } from "./CampaignOverview/PartyRosterTile";
import { RouteLoadError } from "../ui/RouteLoadError";

export default function CampaignOverview({ effectiveUserId }: { effectiveUserId: string }) {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;

  const {
    campaign,
    loading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId ?? null);
  const isDM = campaign?.dmId === effectiveUserId;
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    deleteSession,
    updateSession,
  } = useSessions(campaignId, campaign ? isDM : null);
  const {
    characters,
    loading: charactersLoading,
    error: charactersError,
  } = useCampaignCharacters(
    campaignId ?? null,
    effectiveUserId,
    campaign ? isDM : null
  );
  const {
    summaries: partySummaries,
    loading: partySummariesLoading,
    error: partySummariesError,
  } = useCampaignCharacterSummaries(campaign && !isDM && campaignId ? campaignId : null);
  const ownCharacterIds = useMemo(() => new Set(characters.map((c) => c.id)), [characters]);
  const partyMembers = useMemo(
    () => partySummaries.filter((s) => !ownCharacterIds.has(s.id)),
    [partySummaries, ownCharacterIds]
  );
  const summaries = useMemo(
    () =>
      characters.map((character) => ({
        id: character.id,
        characterName: character.header?.characterName ?? "Unnamed Character",
        userId: character.userId ?? null,
      })),
    [characters]
  );
  const sessionCharacters = useMemo(
    () =>
      isDM
        ? summaries
        : [
            ...summaries,
            ...partyMembers.map((summary) => ({
              id: summary.id,
              characterName: summary.characterName,
              userId: null,
            })),
          ],
    [isDM, partyMembers, summaries]
  );
  const toast = useToast();
  const { setKebabContent, clearKebabContent } = useHeaderExtensionSetters();

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const creatingCharacterRef = useRef(false);
  const [importingCharacter, setImportingCharacter] = useState(false);
  const importingCharacterRef = useRef(false);
  const [repairingSummaries, setRepairingSummaries] = useState(false);
  const repairingSummariesRef = useRef(false);
  const [repairingSessionSummaries, setRepairingSessionSummaries] = useState(false);
  const repairingSessionSummariesRef = useRef(false);

  const handleCreate = useCallback(async () => {
    if (creatingCharacterRef.current) return;
    const name = newCharacterName.trim();
    const validation = validateCharacterName(name);
    if (!validation.isValid) {
      toast.warning(validation.error ?? "Invalid character name");
      return;
    }
    if (!campaignId) return;
    creatingCharacterRef.current = true;
    setCreatingCharacter(true);
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
      toast.error(err instanceof Error ? err.message : "Failed to create character.");
    } finally {
      creatingCharacterRef.current = false;
      setCreatingCharacter(false);
    }
  }, [campaignId, newCharacterName, toast]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = e.target.files?.[0];
      if (!file || !campaignId) return;
      if (importingCharacterRef.current) {
        input.value = "";
        return;
      }
      importingCharacterRef.current = true;
      setImportingCharacter(true);
      try {
        const data = await readCharacterImportFile(file);
        const characterName = await importCharacter(campaignId, data);
        toast.success(`Imported "${characterName}" successfully`, IMPORTANT_TOAST_DURATION);
      } catch (err) {
        console.error("Failed to import character:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to import character. Check the file and try again."
        );
      } finally {
        importingCharacterRef.current = false;
        setImportingCharacter(false);
        input.value = "";
      }
    },
    [campaignId, toast]
  );

  const handleRepairSummaries = useCallback(async () => {
    if (repairingSummariesRef.current || !campaignId) return;
    repairingSummariesRef.current = true;
    setRepairingSummaries(true);
    try {
      const count = await repairCharacterSummaries(campaignId);
      toast.success(`Repaired ${count} character ${count === 1 ? "summary" : "summaries"}.`);
    } catch (err) {
      console.error("Failed to repair character summaries:", err);
      toast.error(err instanceof Error ? err.message : "Failed to repair character summaries.");
    } finally {
      repairingSummariesRef.current = false;
      setRepairingSummaries(false);
    }
  }, [campaignId, toast]);

  const handleRepairSessionSummaries = useCallback(async () => {
    if (repairingSessionSummariesRef.current || !campaignId) return;
    repairingSessionSummariesRef.current = true;
    setRepairingSessionSummaries(true);
    try {
      const count = await repairSessionSummaries(campaignId);
      toast.success(`Repaired ${count} session ${count === 1 ? "summary" : "summaries"}.`);
    } catch (err) {
      console.error("Failed to repair session summaries:", err);
      toast.error(err instanceof Error ? err.message : "Failed to repair session summaries.");
    } finally {
      repairingSessionSummariesRef.current = false;
      setRepairingSessionSummaries(false);
    }
  }, [campaignId, toast]);

  // Inject Import JSON into header kebab for DMs
  useEffect(() => {
    if (!isDM) {
      clearKebabContent();
      return;
    }
    setKebabContent(
      <div className="space-y-2">
        <p className={uiSubheading}>Character Data</p>
        <label
          className={`block px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm rounded bg-slate-700 border border-slate-500 text-slate-100 ${importingCharacter ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-600 cursor-pointer"}`}
        >
          {importingCharacter ? "Importing…" : "Import JSON"}
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
            disabled={importingCharacter}
          />
        </label>
        <button
          type="button"
          onClick={handleRepairSummaries}
          disabled={repairingSummaries}
          className={`block w-full text-left px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm rounded bg-slate-700 border border-slate-500 text-slate-100 ${repairingSummaries ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-600 cursor-pointer"}`}
        >
          {repairingSummaries ? "Repairing…" : "Repair Character Summaries"}
        </button>
        <button
          type="button"
          onClick={handleRepairSessionSummaries}
          disabled={repairingSessionSummaries}
          className={`block w-full text-left px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm rounded bg-slate-700 border border-slate-500 text-slate-100 ${repairingSessionSummaries ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-600 cursor-pointer"}`}
        >
          {repairingSessionSummaries ? "Repairing…" : "Repair Session Summaries"}
        </button>
      </div>
    );
    return () => clearKebabContent();
  }, [
    isDM,
    importingCharacter,
    handleImport,
    repairingSummaries,
    handleRepairSummaries,
    repairingSessionSummaries,
    handleRepairSessionSummaries,
    setKebabContent,
    clearKebabContent,
  ]);

  if (!campaignId) {
    return <div className="text-slate-300 text-center py-10">No campaign selected.</div>;
  }

  if (campaignError || charactersError) {
    return <RouteLoadError resource="campaign" />;
  }

  if (campaignLoading || charactersLoading) {
    return <LoadingState className="text-center py-10">Loading campaign…</LoadingState>;
  }

  if (!campaign) {
    return <div className="text-slate-300 text-center py-10">Campaign not found.</div>;
  }

  const filteredCharacters = search.trim()
    ? characters.filter((c) =>
        (c.header?.characterName ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : characters;

  return (
    <PageShell title={campaign?.name ?? "Campaign Overview"}>
      <Panel>
        {/* GM / Inquisitor name — shown to everyone */}
        {(campaign.gmName || campaign.inquisitorName) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {campaign.gmName && (
              <span className="text-sm lg:text-base text-slate-300">
                <span className={uiTextLabel}>GM</span> {campaign.gmName}
              </span>
            )}
            {campaign.inquisitorName && (
              <span className="text-sm lg:text-base text-slate-300">
                <span className={uiTextLabel}>Inquisitor</span> {campaign.inquisitorName}
              </span>
            )}
          </div>
        )}

        {/* Session form — shown inline when creating */}
        {isDM && showSessionForm && (
          <SessionForm
            campaignId={campaignId}
            characters={summaries}
            onClose={() => setShowSessionForm(false)}
          />
        )}

        {/* CHARACTERS — DM admin view */}
        {isDM && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <SectionHeader>Characters</SectionHeader>
              <input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={
                  editableInputClass(true) +
                  " w-full sm:w-36 lg:w-48 text-xs lg:text-sm py-1 lg:py-1.5"
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                className={editableInputClass(true) + " flex-1"}
                placeholder="Character Name"
                value={newCharacterName}
                maxLength={PRODUCT_LIMITS.characterNameCharacters}
                onChange={(e) => setNewCharacterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
              />
              <Button onClick={handleCreate} disabled={creatingCharacter}>
                {creatingCharacter ? "Creating…" : "Create"}
              </Button>
            </div>

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
        )}

        {/* MY CHARACTERS — player view */}
        {!isDM && (
          <div>
            <SectionHeader className="mb-3">My Characters</SectionHeader>
            {characters.length === 0 ? (
              <p className="text-slate-400 text-sm lg:text-base">
                You haven't claimed a character in this campaign yet.
              </p>
            ) : (
              <div className="space-y-3">
                {characters.map((c) => (
                  <MyCharacterCard key={c.id} character={c} campaignId={campaignId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PARTY — player view */}
        {!isDM && (
          <div>
            <SectionHeader className="mb-3">Party</SectionHeader>
            {partySummariesError ? (
              <ErrorState>Unable to load the party roster. Please refresh the page.</ErrorState>
            ) : partySummariesLoading ? (
              <LoadingState>Loading the party roster…</LoadingState>
            ) : partyMembers.length === 0 ? (
              <p className="text-slate-400 text-sm lg:text-base">No one else has joined yet.</p>
            ) : (
              <div className="space-y-3">
                {partyMembers.map((s) => (
                  <PartyRosterTile key={s.id} summary={s} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES — DM only */}
        {isDM && (
          <div>
            <SectionHeader className="mb-3">Messages</SectionHeader>
            <DMInbox campaignId={campaignId} dmUid={campaign?.dmId ?? ""} characters={characters} />
          </div>
        )}

        {/* CUSTOM ITEM LIBRARY — DM only */}
        {isDM && (
          <div>
            <SectionHeader className="mb-3">Custom Item Library</SectionHeader>
            <CustomItemLibraryAdmin campaignId={campaignId} userId={effectiveUserId} />
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

          {sessionsError ? (
            <ErrorState>Unable to load sessions. Please refresh the page.</ErrorState>
          ) : sessionsLoading ? (
            <LoadingState>Loading sessions…</LoadingState>
          ) : sessions.length === 0 ? (
            <p className="text-slate-400 text-sm lg:text-base">No sessions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  characters={sessionCharacters}
                  isDM={isDM}
                  onDelete={isDM ? (reverseXp) => deleteSession(session.id, reverseXp) : undefined}
                  onSave={isDM ? (data) => updateSession(session.id, data) : undefined}
                  onApplyXp={
                    isDM
                      ? () =>
                          applySessionXp(
                            campaignId,
                            session.id,
                            session.attendees,
                            session.xpAwarded
                          )
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
