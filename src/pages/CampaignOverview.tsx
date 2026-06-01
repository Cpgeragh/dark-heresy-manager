// src/pages/CampaignOverview.tsx

import { useState } from "react";
import { useParams } from "react-router-dom";

import { useIsDM } from "../hooks/useIsDM";
import { useSessions } from "../hooks/useSessions";
import { useCharacterSummaries } from "../hooks/useCharacterSummaries";
import { SessionForm } from "./CampaignOverview/SessionForm";
import { SessionCard } from "./CampaignOverview/SessionCard";
import { CharacterRow } from "./CampaignOverview/CharacterRow";
import { applySessionXp } from "../services/sessionService";

export default function CampaignOverview() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;

  const isDM = useIsDM(campaignId);
  const { sessions, loading: sessionsLoading, deleteSession, updateSession } = useSessions(campaignId);
  const { characters, loading } = useCharacterSummaries(campaignId);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [search, setSearch] = useState("");

  if (!campaignId) {
    return (
      <div className="text-slate-300 text-center py-10">
        No campaign selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-slate-300 text-center py-10">
        Loading campaign...
      </div>
    );
  }

  const filteredCharacters = search.trim()
    ? characters.filter((c) =>
        c.characterName.toLowerCase().includes(search.trim().toLowerCase())
      )
    : characters;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaign Overview</h1>
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
          characters={characters}
          onClose={() => setShowSessionForm(false)}
        />
      )}

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
                characterName={char.characterName}
                userId={char.userId}
              />
            ))
          )}
        </div>
      </div>

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
                characters={characters}
                isDM={isDM}
                onDelete={isDM ? () => deleteSession(session.id) : undefined}
                onSave={isDM ? (data) => updateSession(session.id, data) : undefined}
                onApplyXp={isDM ? () => applySessionXp(campaignId, session.id, session.attendees, session.xpAwarded) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
