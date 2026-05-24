// src/pages/CampaignOverview/SessionCard.tsx

import { useState, useCallback } from "react";
import type { Timestamp } from "firebase/firestore";
import type { SessionDocument } from "../../types/Firestore";

interface Character {
  id: string;
  characterName: string;
}

type SessionWithId = SessionDocument & { id: string };
type SessionUpdateData = Partial<Pick<SessionDocument, "date" | "summary" | "dmNotes" | "xpAwarded" | "attendees">>;

interface Props {
  session: SessionWithId;
  characters: Character[];
  isDM: boolean;
  onDelete?: () => Promise<void>;
  onSave?: (data: SessionUpdateData) => Promise<void>;
}

function toDate(value: SessionDocument["date"]): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as Timestamp).toDate === "function")
    return (value as Timestamp).toDate();
  return new Date();
}

function toInputDate(value: SessionDocument["date"]): string {
  return toDate(value).toISOString().split("T")[0];
}

export function SessionCard({ session, characters, isDM, onDelete, onSave }: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [date, setDate] = useState(toInputDate(session.date));
  const [summary, setSummary] = useState(session.summary);
  const [dmNotes, setDmNotes] = useState(session.dmNotes);
  const [xpAwarded, setXpAwarded] = useState(session.xpAwarded);
  const [attendees, setAttendees] = useState<Set<string>>(new Set(session.attendees));

  const nameById = Object.fromEntries(characters.map((c) => [c.id, c.characterName]));
  const dateStr = toDate(session.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const toggleAttendee = useCallback((id: string) => {
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        date: new Date(date),
        summary,
        dmNotes,
        xpAwarded,
        attendees: [...attendees],
      });
      setMode("view");
    } finally {
      setSaving(false);
    }
  }, [onSave, date, summary, dmNotes, xpAwarded, attendees]);

  const handleCancelEdit = useCallback(() => {
    setDate(toInputDate(session.date));
    setSummary(session.summary);
    setDmNotes(session.dmNotes);
    setXpAwarded(session.xpAwarded);
    setAttendees(new Set(session.attendees));
    setMode("view");
  }, [session]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }, [onDelete]);

  if (mode === "edit") {
    return (
      <div className="border border-amber-600/40 rounded p-4 bg-slate-900/60 space-y-4">
        <h3 className="text-sm font-semibold text-amber-400">Edit Session</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">XP Awarded</label>
            <input
              type="number"
              min={0}
              value={xpAwarded}
              onChange={(e) => setXpAwarded(Math.max(0, Number(e.target.value)))}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">DM Notes (private)</label>
          <textarea
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm resize-none"
          />
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Attendees</p>
          <div className="flex flex-wrap gap-3">
            {characters.map((char) => (
              <label key={char.id} className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendees.has(char.id)}
                  onChange={() => toggleAttendee(char.id)}
                />
                {char.characterName}
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Note: XP changes do not retroactively adjust character totals.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-amber-500 text-slate-900 font-semibold rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-700 rounded p-4 bg-slate-900/40 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{dateStr}</span>
        <div className="flex items-center gap-2">
          {session.xpAwarded > 0 && (
            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
              +{session.xpAwarded} XP
            </span>
          )}
          {isDM && onSave && (
            <button
              onClick={() => setMode("edit")}
              className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
            >
              Edit
            </button>
          )}
          {isDM && onDelete && mode !== "confirmDelete" && (
            <button
              onClick={() => setMode("confirmDelete")}
              className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded hover:bg-red-900/70"
            >
              Delete
            </button>
          )}
          {mode === "confirmDelete" && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-400">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setMode("view")}
                disabled={deleting}
                className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                No
              </button>
            </div>
          )}
        </div>
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
