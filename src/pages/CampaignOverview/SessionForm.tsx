// src/pages/CampaignOverview/SessionForm.tsx

import { useState, useCallback, useRef } from "react";
import { useToast } from "../../components/Toast";
import { createSession } from "../../services/sessionService";
import { Button } from "../../ui/buttons/Button";
import { SectionHeader } from "../../ui/SectionHeader";
import { PRODUCT_LIMITS } from "../../constants/productLimits";
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

interface Props {
  campaignId: string;
  characters: Character[];
  onClose: () => void;
}

export function SessionForm({ campaignId, characters, onClose }: Props) {
  const toast = useToast();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState("");
  const [dmNotes, setDmNotes] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [attendees, setAttendees] = useState<Set<string>>(new Set());
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
      await createSession(campaignId, {
        date: new Date(date),
        summary,
        dmNotes,
        xpAwarded,
        attendees: [...attendees],
      });
      toast.success("Session saved");
      onClose();
    } catch (err) {
      console.error("Session save error:", err);
      toast.error("Failed to save session");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [campaignId, date, summary, dmNotes, xpAwarded, attendees, toast, onClose]);

  return (
    <div className={uiSection + " space-y-4"}>
      <SectionHeader>New Session</SectionHeader>

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
            max={PRODUCT_LIMITS.sessionXpAward}
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
          maxLength={PRODUCT_LIMITS.sessionSummaryCharacters}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className={editableTextareaClass(true, "none")}
        />
      </div>

      <div>
        <label className={uiFormLabelSecondary}>DM Notes (private)</label>
        <textarea
          value={dmNotes}
          maxLength={PRODUCT_LIMITS.sessionDmNotesCharacters}
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

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Session"}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
