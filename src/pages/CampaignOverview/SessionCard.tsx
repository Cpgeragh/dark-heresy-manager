// src/pages/CampaignOverview/SessionCard.tsx

import { useState, useCallback } from "react";
import type { Timestamp } from "firebase/firestore";
import type { SessionDocument } from "../../types/Firestore";
import { useToast } from "../../components/Toast";
import { ConfirmInline } from "../../ui/ConfirmInline";
import { uiFormLabelSecondary } from "../../ui/editableStyles";

interface Character {
  id: string;
  characterName: string;
}

type SessionWithId = SessionDocument & { id: string };
type SessionUpdateData = Partial<
  Pick<SessionDocument, "date" | "summary" | "dmNotes" | "xpAwarded" | "attendees">
>;

interface Props {
  session: SessionWithId;
  characters: Character[];
  isDM: boolean;
  onDelete?: () => Promise<void>;
  onSave?: (data: SessionUpdateData) => Promise<void>;
  onApplyXp?: () => Promise<void>;
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

export function SessionCard({ session, characters, isDM, onDelete, onSave, onApplyXp }: Props) {
  const toast = useToast();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applyingXp, setApplyingXp] = useState(false);

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
    } catch (err) {
      console.error("Failed to save session:", err);
      toast.error("Failed to save session. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [onSave, date, summary, dmNotes, xpAwarded, attendees, toast]);

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
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [onDelete, toast]);

  const handleApplyXp = useCallback(async () => {
    if (!onApplyXp) return;
    setApplyingXp(true);
    try {
      await onApplyXp();
      toast.success(
        `+${session.xpAwarded} XP applied to ${session.attendees.length} character(s).`
      );
    } catch (err) {
      console.error("Failed to apply XP:", err);
      toast.error("Failed to apply XP. Please try again.");
    } finally {
      setApplyingXp(false);
    }
  }, [onApplyXp, session.xpAwarded, session.attendees.length, toast]);

  if (mode === "edit") {
    return (
      <div className="border border-red-700/40 rounded p-4 lg:p-5 bg-slate-900/60 space-y-4">
        <h3 className="text-sm lg:text-base font-semibold text-red-500">Edit Session</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={uiFormLabelSecondary}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-600 rounded text-sm lg:text-base"
            />
          </div>
          <div>
            <label className={uiFormLabelSecondary}>XP Awarded</label>
            <input
              type="number"
              min={0}
              value={xpAwarded}
              onChange={(e) => setXpAwarded(Math.max(0, Number(e.target.value)))}
              className="w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-600 rounded text-sm lg:text-base"
            />
          </div>
        </div>

        <div>
          <label className={uiFormLabelSecondary}>Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-600 rounded text-sm lg:text-base resize-none"
          />
        </div>

        <div>
          <label className={uiFormLabelSecondary}>DM Notes (private)</label>
          <textarea
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            rows={2}
            className="w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-600 rounded text-sm lg:text-base resize-none"
          />
        </div>

        <div>
          <p className="text-xs lg:text-sm text-slate-400 mb-2">Attendees</p>
          <div className="flex flex-wrap gap-3">
            {characters.map((char) => (
              <label key={char.id} className="flex items-center gap-1 text-sm lg:text-base cursor-pointer">
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

        <p className="text-xs lg:text-sm text-slate-500">
          Note: XP changes do not retroactively adjust character totals.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 lg:px-4 py-1.5 lg:py-2 border border-red-500 text-red-500 font-semibold rounded text-sm lg:text-base hover:bg-red-500/10 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-slate-700 text-slate-300 rounded text-sm lg:text-base hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-500 bg-slate-900/60 p-3 lg:p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold lg:text-lg">{dateStr}</span>
        <div className="flex items-center gap-2">
          {session.xpAwarded > 0 && (
            <span className="text-xs lg:text-sm px-2 lg:px-3 py-1 bg-red-500/20 text-red-500 rounded">
              +{session.xpAwarded} XP
            </span>
          )}
          {isDM &&
            session.xpAwarded > 0 &&
            session.attendees.length > 0 &&
            session.xpApplied !== undefined &&
            (session.xpApplied === true ? (
              <span className="text-xs lg:text-sm px-2 lg:px-3 py-1 bg-green-500/20 text-green-400 rounded">
                XP Applied ✓
              </span>
            ) : (
              <button
                onClick={handleApplyXp}
                disabled={applyingXp}
                className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 border border-red-500 text-red-500 font-semibold rounded hover:bg-red-500/10 disabled:opacity-50 transition"
              >
                {applyingXp ? "Applying…" : "Apply XP"}
              </button>
            ))}
          {isDM && onSave && (
            <button
              onClick={() => setMode("edit")}
              className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
            >
              Edit
            </button>
          )}
          {isDM && onDelete && (
            <ConfirmInline
              triggerLabel="Delete"
              question="Delete?"
              size="sm"
              busy={deleting}
              onConfirm={handleDelete}
            />
          )}
        </div>
      </div>

      {session.attendees.length > 0 && (
        <p className="text-xs lg:text-sm text-slate-400">
          Attendees: {session.attendees.map((id) => nameById[id] ?? id).join(", ")}
        </p>
      )}

      {session.summary && <p className="text-sm lg:text-base text-slate-300">{session.summary}</p>}

      {isDM && session.dmNotes && (
        <p className="text-xs lg:text-sm text-slate-500 italic border-t border-slate-700 pt-2">
          DM: {session.dmNotes}
        </p>
      )}
    </div>
  );
}
