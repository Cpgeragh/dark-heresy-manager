// src/pages/CampaignOverview/SessionForm.tsx
// The form for a session that already exists. "open" is the notes pop-up of a session in
// progress, "close" collects the XP and the final attendees, and "edit" changes a closed session.

import { useState, useCallback, useRef } from "react";
import { useToast } from "../../components/Toast";
import type { CloseSessionData, SessionUpdateData } from "../../services/sessionService";
import type { SessionListDocument } from "../../types/Firestore";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { FormLabel } from "../../ui/forms/FormLabel";
import { RequiredMark } from "../../ui/forms/RequiredMark";
import { PRODUCT_LIMITS } from "../../constants/productLimits";
import { sanitizeNonNegativeIntegerInput } from "../../utils/formInput";
import { toSessionInputDate } from "../../utils/sessionDate";
import {
  editableInputClass,
  editableTextareaClass,
  uiTwoColumnGrid,
  uiTextNotice,
} from "../../ui/styles/editableStyles";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { AttendeePicker } from "./AttendeePicker";

interface Character {
  id: string;
  characterName: string;
}

interface Props {
  mode: "open" | "close" | "edit";
  characters: Character[];
  session: SessionListDocument;
  onClose: () => void;
  /** Saves an open or edited session. */
  onSave?: (data: SessionUpdateData) => Promise<void>;
  /** The close pop-up hands the XP and attendees to the confirmation instead of saving. */
  onRequestCloseSession?: (data: CloseSessionData) => void;
}

const TITLES = { open: "Session in Progress", close: "Close Session", edit: "Edit Session" };

export function SessionForm({
  mode,
  characters,
  session,
  onClose,
  onSave,
  onRequestCloseSession,
}: Props) {
  recordComponentRender("SessionForm");
  const toast = useToast();
  const scrollPositionRef = useRef(0);
  const [date, setDate] = useState(toSessionInputDate(session.date));
  const [summary, setSummary] = useState(session.summary);
  const [dmNotes, setDmNotes] = useState(session.dmNotes ?? "");
  const [xpAwarded, setXpAwarded] = useState(mode === "edit" ? String(session.xpAwarded) : "");
  const [attendees, setAttendees] = useState<string[]>(session.attendees);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const showSession = mode !== "open";
  const showNotes = mode !== "close";
  const showAttendees = mode !== "open";

  const handleSubmit = useCallback(async () => {
    if (savingRef.current) return;
    if (mode === "close") {
      onRequestCloseSession?.({ xpAwarded: Number(xpAwarded), attendees });
      return;
    }
    if (!onSave || (mode === "edit" && !date)) return;

    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(
        mode === "edit"
          ? { date: new Date(date), summary, dmNotes, xpAwarded: Number(xpAwarded), attendees }
          : { summary, dmNotes }
      );
      toast.success("Session saved");
      onClose();
    } catch (err) {
      console.error("Session save error:", err);
      toast.error(err instanceof Error && err.message ? err.message : "Failed to save session");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [
    mode,
    date,
    summary,
    dmNotes,
    xpAwarded,
    attendees,
    onSave,
    onRequestCloseSession,
    toast,
    onClose,
  ]);

  const canSubmit =
    mode === "open"
      ? Boolean(summary.trim())
      : xpAwarded !== "" &&
        attendees.length > 0 &&
        (mode === "close" || (Boolean(date) && Boolean(summary.trim())));

  return (
    <CustomFormShell
      title={TITLES[mode]}
      scrollPositionRef={scrollPositionRef}
      onClose={onClose}
      canSubmit={canSubmit}
      submitLabel={mode === "close" ? "Close Session" : "Save"}
      onSubmit={handleSubmit}
      saving={saving}
    >
      {showSession && (
        <CustomFormSection title="Session">
          <div className={uiTwoColumnGrid}>
            {mode === "edit" && (
              <div>
                <FormLabel htmlFor="session-date" required>
                  Date
                </FormLabel>
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
            )}
            <div>
              <FormLabel htmlFor="session-xp" required>
                XP Awarded
              </FormLabel>
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
          {mode === "edit" && session.xpApplied === true && (
            <p className={uiTextNotice}>
              XP was already applied. Changing the XP or the attendees adjusts those characters' XP
              by the difference.
            </p>
          )}
        </CustomFormSection>
      )}

      {showNotes && (
        <CustomFormSection title="Notes">
          <div>
            <FormLabel htmlFor="session-summary" required>
              Summary
            </FormLabel>
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
            <FormLabel htmlFor="session-dm-notes">DM Notes (Private)</FormLabel>
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
      )}

      {showAttendees && (
        <CustomFormSection
          title={
            <>
              Attendees <RequiredMark />
            </>
          }
        >
          <AttendeePicker characters={characters} selected={attendees} onChange={setAttendees} />
        </CustomFormSection>
      )}
    </CustomFormShell>
  );
}
