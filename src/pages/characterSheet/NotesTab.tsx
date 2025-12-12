// src/pages/characterSheet/NotesTab.tsx

interface NotesTabProps {
  notes: string;
  editable: boolean;
  onSave: (value: string) => void;
}

export function NotesTab({ notes, editable, onSave }: NotesTabProps) {
  return (
    <div className="space-y-3 text-slate-300">
      <h2 className="text-xl font-semibold">Notes</h2>

      {!editable ? (
        <div className="rounded border border-slate-700 bg-slate-900/40 p-4">
          {notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {notes}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              No notes recorded.
            </p>
          )}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={(e) => onSave(e.target.value)}
          placeholder="Campaign notes, reminders, character details, or anything else…"
          className="w-full min-h-[240px] bg-slate-900 border border-slate-700 rounded p-4 text-sm text-slate-100 resize-y leading-relaxed"
        />
      )}
    </div>
  );
}