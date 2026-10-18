// src/pages/CampaignOverview/SessionForm.tsx

import { useState, useCallback, useRef } from "react";
import { useToast } from "../../components/Toast";
import { createSession, type SessionUpdateData } from "../../services/sessionService";
import type { SessionListDocument } from "../../types/Firestore";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import { PRODUCT_LIMITS } from "../../constants/productLimits";
import { sanitizeNonNegativeIntegerInput } from "../../utils/formInput";
import { toSessionInputDate } from "../../utils/sessionDate";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
  uiTextMeta,
} from "../../ui/styles/editableStyles";
import { recordComponentRender } from "../../performance/performanceMetrics";

interface Character {
  id: string;
  characterName: string;
}

interface Props {
  campaignId: string;
  characters: Character[];
  onClose: () => void;
  /** An existing session to edit. Without it the form creates a new session. */
  session?: SessionListDocument;
  /** Saves the edited session. Required when `session` is given. */
  onSave?: (data: SessionUpdateData) => Promise<void>;
}

export function SessionForm({ campaignId, characters, onClose, session, onSave }: Props) {
  recordComponentRender("SessionForm");
  const toast = useToast();
  const editing = session !== undefined;
  const scrollPositionRef = useRef(0);
  const [date, setDate] = useState(
    session ? toSessionInputDate(session.date) : new Date().toISOString().split("T")[0]
  );
  const [summary, setSummary] = useState(session?.summary ?? "");
  const [dmNotes, setDmNotes] = useState(session?.dmNotes ?? "");
  const [xpAwarded, setXpAwarded] = useState(session ? String(session.xpAwarded) : "");
  const [attendees, setAttendees] = useState<Set<string>>(new Set(session?.attendees ?? []));
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const toggleAttendee = useCallback((id: string) => {
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    if (!date) {
      toast.warning("Please enter a session date");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const data = {
        date: new Date(date),
        summary,
        dmNotes,
        xpAwarded: Number(xpAwarded),
        attendees: [...attendees],
      };
      if (editing && onSave) await onSave(data);
      else await createSession(campaignId, data);
      toast.success("Session saved");
      onClose();
    } catch (err) {
      console.error("Session save error:", err);
      toast.error(
        editing && err instanceof Error && err.message ? err.message : "Failed to save session"
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [campaignId, date, summary, dmNotes, xpAwarded, attendees, editing, onSave, toast, onClose]);

  return (
    <CustomFormShell
      title={editing ? "Edit Session" : "New Session"}
      scrollPositionRef={scrollPositionRef}
      onClose={onClose}
      canSubmit={Boolean(date) && xpAwarded !== "" && Boolean(summary.trim())}
      submitLabel={editing ? "Save" : "Save Session"}
      onSubmit={handleSave}
      saving={saving}
    >
      <CustomFormSection title="Session">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="session-date">Date</RequiredFormLabel>
            <input
              id="session-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${editableInputClass(true)} mt-0.5`}
              autoComplete="off"
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="session-xp">XP Awarded</RequiredFormLabel>
            <input
              id="session-xp"
              type="text"
              inputMode="numeric"
              required
              value={xpAwarded}
              onChange={(e) => {
                const next = sanitizeNonNegativeIntegerInput(e.target.value);
                if (next === "" || Number(next) <= PRODUCT_LIMITS.sessionXpAward) {
                  setXpAwarded(next);
                }
              }}
              className={`${editableInputClass(true)} mt-0.5`}
              autoComplete="off"
            />
          </div>
        </div>
        {session?.xpApplied === true && (
          <p className={uiTextMeta}>
            XP was already applied. Changing the XP or the attendees adjusts those characters' XP by
            the difference.
          </p>
        )}
      </CustomFormSection>

      <CustomFormSection title="Notes">
        <div>
          <RequiredFormLabel htmlFor="session-summary">Summary</RequiredFormLabel>
          <textarea
            id="session-summary"
            required
            value={summary}
            maxLength={PRODUCT_LIMITS.sessionSummaryCharacters}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className={`${editableTextareaClass(true, "none")} mt-0.5`}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="session-dm-notes" className={uiFormLabel}>
            DM Notes (private)
          </label>
          <textarea
            id="session-dm-notes"
            value={dmNotes}
            maxLength={PRODUCT_LIMITS.sessionDmNotesCharacters}
            onChange={(e) => setDmNotes(e.target.value)}
            rows={2}
            className={`${editableTextareaClass(true, "none")} mt-0.5`}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Attendees">
        <div className="flex flex-wrap gap-3" role="group" aria-label="Attendees">
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
      </CustomFormSection>
    </CustomFormShell>
  );
}
