// src/pages/CampaignOverview/SessionForm.tsx

import { useState, useCallback } from "react";
import { useToast } from "../../components/Toast";
import { createSession } from "../../services/sessionService";

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
    <div className="border border-slate-600 rounded p-4 bg-slate-900/60 space-y-4">
      <h3 className="text-lg font-semibold">New Session</h3>

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

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Session"}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
