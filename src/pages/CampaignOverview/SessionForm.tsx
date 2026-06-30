// src/pages/CampaignOverview/SessionForm.tsx

import { useState, useCallback } from "react";
import { useToast } from "../../components/Toast";
import { createSession } from "../../services/sessionService";
import { uiFormLabelSecondary } from "../../ui/editableStyles";

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

  const toggleAttendee = useCallback((id: string) => {
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!date) {
      toast.warning("Please enter a session date");
      return;
    }

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
      setSaving(false);
    }
  }, [campaignId, date, summary, dmNotes, xpAwarded, attendees, toast, onClose]);

  return (
    <div className="rounded-lg border border-slate-500 bg-slate-900/60 p-3 lg:p-4 space-y-4">
      <h3 className="border-l-2 border-red-700 pl-2 text-xs lg:text-sm font-semibold uppercase tracking-widest text-red-500">New Session</h3>

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

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 lg:px-5 py-2 lg:py-2.5 border border-red-500 text-red-500 font-semibold rounded text-sm lg:text-base hover:bg-red-500/10 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Session"}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-700 text-slate-300 rounded text-sm lg:text-base hover:bg-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
