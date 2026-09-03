// src/pages/CampaignOverview/SessionCard.tsx

import { useState, useCallback, useRef } from "react";
import type { Timestamp } from "firebase/firestore";
import type { SessionListDocument } from "../../types/Firestore";
import {
  getSessionXpAffectedDocumentCount,
  type SessionUpdateData,
} from "../../services/sessionService";
import { useToast } from "../../components/Toast";
import { Button } from "../../ui/buttons/Button";
import { ConfirmInline } from "../../ui/forms/ConfirmInline";
import { SectionHeader } from "../../ui/SectionHeader";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabelSecondary,
  uiSection,
} from "../../ui/styles/editableStyles";

interface Character {
  id: string;
  characterName: string;
}

type SessionWithId = SessionListDocument & { id: string };

interface Props {
  session: SessionWithId;
  characters: Character[];
  isDM: boolean;
  onDelete?: (reverseXp: boolean) => Promise<void>;
  onSave?: (data: SessionUpdateData) => Promise<void>;
  onApplyXp?: () => Promise<void>;
}

function toDate(value: SessionListDocument["date"]): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as Timestamp).toDate === "function")
    return (value as Timestamp).toDate();
  return new Date();
}

function toInputDate(value: SessionListDocument["date"]): string {
  return toDate(value).toISOString().split("T")[0];
}

export function SessionCard({ session, characters, isDM, onDelete, onSave, onApplyXp }: Props) {
  const toast = useToast();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reverseXp, setReverseXp] = useState(false);
  const [applyingXp, setApplyingXp] = useState(false);
  const applyingXpRef = useRef(false);

  const [date, setDate] = useState(toInputDate(session.date));
  const [summary, setSummary] = useState(session.summary);
  const [dmNotes, setDmNotes] = useState(session.dmNotes ?? "");
  const [xpAwarded, setXpAwarded] = useState(session.xpAwarded);
  const [attendees, setAttendees] = useState<Set<string>>(new Set(session.attendees));

  const nameById = Object.fromEntries(characters.map((c) => [c.id, c.characterName]));
  const dateStr = toDate(session.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const xpAffectedDocuments = getSessionXpAffectedDocumentCount(session.attendees.length);

  const toggleAttendee = useCallback((id: string) => {
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave || savingRef.current) return;
    savingRef.current = true;
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
      savingRef.current = false;
      setSaving(false);
    }
  }, [onSave, date, summary, dmNotes, xpAwarded, attendees, toast]);

  const handleCancelEdit = useCallback(() => {
    setDate(toInputDate(session.date));
    setSummary(session.summary);
    setDmNotes(session.dmNotes ?? "");
    setXpAwarded(session.xpAwarded);
    setAttendees(new Set(session.attendees));
    setMode("view");
  }, [session]);

  const handleDelete = useCallback(async () => {
    if (!onDelete || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await onDelete(reverseXp);
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session. Please try again.");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
      setConfirmingDelete(false);
      setReverseXp(false);
    }
  }, [onDelete, reverseXp, toast]);

  const handleApplyXp = useCallback(async () => {
    if (!onApplyXp || applyingXpRef.current) return;
    applyingXpRef.current = true;
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
      applyingXpRef.current = false;
      setApplyingXp(false);
    }
  }, [onApplyXp, session.xpAwarded, session.attendees.length, toast]);

  if (mode === "edit") {
    return (
      <div className="border border-red-700/40 rounded p-4 lg:p-5 bg-slate-900/60 space-y-4">
        <SectionHeader as="h3">Edit Session</SectionHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={uiFormLabelSecondary}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={editableInputClass(true)}
            />
          </div>
          <div>
            <label className={uiFormLabelSecondary}>XP Awarded</label>
            <input
              type="number"
              min={0}
              value={xpAwarded}
              onChange={(e) => setXpAwarded(Math.max(0, Number(e.target.value)))}
              className={editableInputClass(true)}
            />
          </div>
        </div>

        <div>
          <label className={uiFormLabelSecondary}>Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className={editableTextareaClass(true, "none")}
          />
        </div>

        <div>
          <label className={uiFormLabelSecondary}>DM Notes (private)</label>
          <textarea
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            rows={2}
            className={editableTextareaClass(true, "none")}
          />
        </div>

        <div>
          <p className="text-xs lg:text-sm text-slate-400 mb-2">Attendees</p>
          <div className="flex flex-wrap gap-3">
            {characters.map((char) => (
              <label
                key={char.id}
                className="flex items-center gap-1 text-sm lg:text-base cursor-pointer"
              >
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="secondary" onClick={handleCancelEdit} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={uiSection + " space-y-2"}>
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
              <Button size="sm" onClick={handleApplyXp} disabled={applyingXp}>
                {applyingXp ? "Applying…" : `Apply XP (${xpAffectedDocuments} docs)`}
              </Button>
            ))}
          {isDM && onSave && (
            <Button variant="secondary" size="sm" onClick={() => setMode("edit")}>
              Edit
            </Button>
          )}
          {isDM &&
            onDelete &&
            (session.xpApplied === true ? (
              confirmingDelete ? (
                <div
                  className="flex flex-col items-start gap-1.5"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="text-xs lg:text-sm text-red-400">
                    This session's XP was already applied. Deleting it won't remove that XP unless
                    checked below.
                  </span>
                  <label className="flex items-center gap-1.5 text-xs lg:text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reverseXp}
                      onChange={(e) => setReverseXp(e.target.checked)}
                      disabled={deleting}
                    />
                    Also remove {session.xpAwarded} XP from attendees
                  </label>
                  <span className="text-xs lg:text-sm text-slate-500">
                    This will affect {reverseXp ? xpAffectedDocuments : 2} documents.
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleting}
                      onClick={() => handleDelete()}
                    >
                      {deleting ? "…" : "Yes"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={deleting}
                      onClick={() => {
                        setConfirmingDelete(false);
                        setReverseXp(false);
                      }}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="dangerGhost" size="sm" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </Button>
              )
            ) : (
              <ConfirmInline
                triggerLabel="Delete"
                question="Delete?"
                size="sm"
                busy={deleting}
                onConfirm={() => handleDelete()}
              />
            ))}
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
