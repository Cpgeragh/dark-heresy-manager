// src/pages/characterSheet/NotesTab.tsx

import { useCallback } from "react";
import { editableTextareaClass, uiSection, readOnlyBadgeClass } from "../../ui/editableStyles";

interface NotesTabProps {
  notes: string;
  editable: boolean;
  onSave: (value: string) => void;
}

export function NotesTab({ notes, editable, onSave }: NotesTabProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onSave(e.target.value);
    },
    [onSave]
  );

  return (
    <div className="space-y-3">
      {!editable && <span className={readOnlyBadgeClass()}>Read-only</span>}

      {!editable ? (
        <div className={uiSection}>
          {notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{notes}</p>
          ) : (
            <p className="text-sm text-slate-400">No notes recorded.</p>
          )}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Campaign notes, reminders, character details, or anything else…"
          className={editableTextareaClass(true) + " min-h-[240px] p-4 leading-relaxed"}
        />
      )}
    </div>
  );
}
