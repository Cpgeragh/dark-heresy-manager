// src/pages/characterSheet/NotesTab.tsx

interface NotesTabProps {
  notes: string;
  editable: boolean;
  onSave: (value: string) => void;
}

export function NotesTab({ notes, editable, onSave }: NotesTabProps) {
  if (!editable) {
    return (
      <p className="text-slate-300 whitespace-pre-wrap">
        {notes || "No notes yet."}
      </p>
    );
  }

  return (
    <textarea
      defaultValue={notes}
      onBlur={(e) => onSave(e.target.value)}
      className="w-full h-40 bg-slate-800 border border-slate-600 p-2 rounded text-slate-100"
    />
  );
}