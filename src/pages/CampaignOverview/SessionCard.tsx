// src/pages/CampaignOverview/SessionCard.tsx

import type { Timestamp } from "firebase/firestore";
import type { SessionDocument } from "../../types/Firestore";

interface Character {
  id: string;
  characterName: string;
}

type SessionWithId = SessionDocument & { id: string };

interface Props {
  session: SessionWithId;
  characters: Character[];
  isDM: boolean;
}

function toDate(value: SessionDocument["date"]): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as Timestamp).toDate === "function")
    return (value as Timestamp).toDate();
  return new Date();
}

export function SessionCard({ session, characters, isDM }: Props) {
  const nameById = Object.fromEntries(characters.map((c) => [c.id, c.characterName]));
  const dateStr = toDate(session.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border border-slate-700 rounded p-4 bg-slate-900/40 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{dateStr}</span>
        {session.xpAwarded > 0 && (
          <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
            +{session.xpAwarded} XP
          </span>
        )}
      </div>

      {session.attendees.length > 0 && (
        <p className="text-xs text-slate-400">
          Attendees: {session.attendees.map((id) => nameById[id] ?? id).join(", ")}
        </p>
      )}

      {session.summary && (
        <p className="text-sm text-slate-300">{session.summary}</p>
      )}

      {isDM && session.dmNotes && (
        <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2">
          DM: {session.dmNotes}
        </p>
      )}
    </div>
  );
}
