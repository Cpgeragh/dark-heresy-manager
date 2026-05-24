// src/pages/CampaignOverview.tsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDocs } from "firebase/firestore";
import { charactersCollectionRef } from "../firebase/converters";

import { useClaimLogs } from "../hooks/useClaimLogs";
import { useIsDM } from "../hooks/useIsDM";
import { useSessions } from "../hooks/useSessions";
import { SessionForm } from "./CampaignOverview/SessionForm";
import { SessionCard } from "./CampaignOverview/SessionCard";

type CharacterSummary = {
  id: string;
  characterName: string;
  userId: string | null;
};

export default function CampaignOverview() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;

  const isDM = useIsDM(campaignId);
  const { sessions, loading: sessionsLoading, deleteSession, updateSession } = useSessions(campaignId);
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!campaignId) return;

    async function load() {
      setLoading(true);

      const snap = await getDocs(charactersCollectionRef(campaignId));
      const list: CharacterSummary[] = snap.docs.map((d) => ({
        id: d.id,
        characterName: d.data().header?.characterName ?? "Unnamed Character",
        userId: d.data().userId ?? null,
      }));

      setCharacters(list);
      setLoading(false);
    }

    load();
  }, [campaignId]);

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
          {(() => {
            const filtered = search.trim()
              ? characters.filter((c) =>
                  c.characterName.toLowerCase().includes(search.trim().toLowerCase())
                )
              : characters;
            return filtered.length === 0 ? (
              <p className="text-slate-400 text-sm">
                {search.trim() ? `No characters match "${search}".` : "No characters yet."}
              </p>
            ) : (
              filtered.map((char) => (
                <CampaignOverviewCharacterRow
                  key={char.id}
                  campaignId={campaignId}
                  characterId={char.id}
                  characterName={char.characterName}
                  userId={char.userId}
                />
              ))
            );
          })()}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignOverviewCharacterRow({
  campaignId,
  characterId,
  characterName,
  userId,
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
  userId: string | null;
}) {
  const { logs } = useClaimLogs(campaignId, characterId);

  const latest = logs.length > 0 ? logs[0] : null;

  return (
    <div className="border border-slate-700 p-4 rounded bg-slate-900/40">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{characterName}</h2>
          <p className="text-xs text-slate-400">
            Character ID: <code>{characterId}</code>
          </p>
          <p className="text-xs text-slate-400">
            Owner UID: <code>{userId ?? "Unclaimed"}</code> {/* FIXED: Changed from || to ?? */}
          </p>

          {latest && (
            <p className="text-xs text-slate-300 mt-1">
              Last event: {latest.action} by {latest.actorUid}
            </p>
          )}
        </div>

        <Link
          to={`/campaign/${campaignId}/character/${characterId}`}
          className="px-3 py-1 rounded bg-amber-500 text-black text-sm border border-amber-400 hover:bg-amber-400"
        >
          Open Sheet
        </Link>
      </div>
    </div>
  );
}