// src/pages/characterSheet/NotesTab.tsx

import {
  editableTextareaClass,
  sectionContainerClass,
  readOnlyBadgeClass,
} from "../../ui/editableStyles";

interface NotesTabProps {
  notes: string;
  editable: boolean;
  onSave: (value: string) => void;
}

export function NotesTab({ notes, editable, onSave }: NotesTabProps) {
  return (
    <div className="space-y-3 text-slate-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notes</h2>
        {!editable && (
          <span className={readOnlyBadgeClass()}>
            Read-only
          </span>
        )}
      </div>

      {!editable ? (
        <div className={sectionContainerClass(false)}>
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
          className={editableTextareaClass(true) + " min-h-[240px] p-4 leading-relaxed"}
        />
      )}
    </div>
  );
}