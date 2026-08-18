// src/pages/characterSheet/NotesTab.tsx

import { useRef, useState } from "react";
import type { NoteEntry } from "../../types/Character";
import { AddButton } from "../../ui/AddButton";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { colourCyan } from "../../ui/colourTokens";
import { CustomFormShell } from "../../ui/CustomFormShell";
import { PickerBody, PickerModal } from "../../ui/PickerModal";
import { RemoveButton } from "../../ui/RemoveButton";
import { RequiredFormLabel } from "../../ui/RequiredFormLabel";
import {
  editableInputClass,
  editableTextareaClass,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { createLocalId } from "../../utils/createLocalId";

interface NotesTabProps {
  notes: string | NoteEntry[];
  editable: boolean;
  onSave: (value: string | NoteEntry[]) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function NotesTab({ notes, editable, onSave }: NotesTabProps) {
  const entries = Array.isArray(notes) ? notes : [];
  const legacyText = typeof notes === "string" ? notes : "";
  const sorted = [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const [mode, setMode] = useState<"add" | "edit" | "view" | null>(null);
  const [activeEntry, setActiveEntry] = useState<NoteEntry | null>(null);
  const [deleteArmed, setDeleteArmed] = useState<NoteEntry | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const formScrollPositionRef = useRef(0);

  const canSubmit = Boolean(title.trim()) && Boolean(text.trim());

  function openAdd() {
    setTitle("");
    setText("");
    setMode("add");
  }

  function openView(entry: NoteEntry) {
    setActiveEntry(entry);
    setMode("view");
  }

  function openEdit(entry: NoteEntry) {
    setActiveEntry(entry);
    setTitle(entry.title);
    setText(entry.text);
    setMode("edit");
  }

  function closeAll() {
    setMode(null);
    setActiveEntry(null);
  }

  function submitAdd() {
    if (!canSubmit) return;
    const now = new Date().toISOString();
    const newEntry: NoteEntry = {
      id: createLocalId("note"),
      title: title.trim(),
      text: text.trim(),
      updatedAt: now,
    };
    const base = legacyText.trim()
      ? [{ id: createLocalId("note"), title: "Notes", text: legacyText.trim(), updatedAt: now }, ...entries]
      : entries;
    onSave([...base, newEntry]);
    closeAll();
  }

  function submitEdit() {
    if (!canSubmit || !activeEntry) return;
    onSave(
      entries.map((entry) =>
        entry.id === activeEntry.id
          ? { ...entry, title: title.trim(), text: text.trim(), updatedAt: new Date().toISOString() }
          : entry
      )
    );
    closeAll();
  }

  function confirmDelete() {
    if (!deleteArmed) return;
    onSave(entries.filter((entry) => entry.id !== deleteArmed.id));
    setDeleteArmed(null);
  }

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex justify-end">
          <AddButton label="Add Note" onClick={openAdd} />
        </div>
      )}

      {entries.length === 0 && legacyText.trim() ? (
        editable ? (
          <textarea
            value={legacyText}
            onChange={(event) => onSave(event.target.value)}
            placeholder="Campaign notes, reminders, character details, or anything else…"
            className={editableTextareaClass(true) + " min-h-[240px] p-4 leading-relaxed"}
          />
        ) : (
          <div className={`${uiSectionShell} p-3 lg:p-4`}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{legacyText}</p>
          </div>
        )
      ) : sorted.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No notes yet.</p>
      ) : (
        <div className="grid grid-cols-2 items-start gap-3">
          {[sorted.slice(0, Math.ceil(sorted.length / 2)), sorted.slice(Math.ceil(sorted.length / 2))].map(
            (column, index) => (
              <div key={index} className="space-y-3">
                {column.map((entry) => (
                  <div key={entry.id} className={`${uiSectionShell} p-4 transition hover:bg-slate-700/40 lg:p-5`}>
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <button type="button" onClick={() => openView(entry)} className="min-w-0 text-left lg:flex-1">
                        <span className={uiTextLabel}>{entry.title}</span>
                        <p className="mt-2 text-sm text-slate-300 leading-relaxed line-clamp-3 min-h-[4.3rem]">{entry.text}</p>
                        <Chip size="sm" className={`mt-2 ${colourCyan}`}>
                          {formatDate(entry.updatedAt)}
                        </Chip>
                      </button>
                      {editable && (
                        <div className="flex shrink-0 justify-end gap-1.5 order-first lg:order-2">
                          <Button size="xs" onClick={() => openEdit(entry)}>Edit</Button>
                          <RemoveButton onClick={() => setDeleteArmed(entry)} label="Remove" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {(mode === "add" || mode === "edit") && (
        <CustomFormShell
          title={mode === "add" ? "Add Note" : "Edit Note"}
          scrollPositionRef={formScrollPositionRef}
          onClose={closeAll}
          canSubmit={canSubmit}
          submitLabel={mode === "add" ? "Add Note" : "Save Note"}
          onSubmit={mode === "add" ? submitAdd : submitEdit}
        >
          <div>
            <RequiredFormLabel htmlFor="note-title">Title</RequiredFormLabel>
            <input
              id="note-title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Session 12, Inquisitor Varn…"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="note-text">Note</RequiredFormLabel>
            <textarea
              id="note-text"
              required
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="What do you want to remember…"
              rows={10}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormShell>
      )}

      {mode === "view" && activeEntry && (
        <PickerModal
          title={activeEntry.title}
          query=""
          onQueryChange={() => undefined}
          onClose={closeAll}
          hideSearch
          isEmpty={false}
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed whitespace-pre-wrap`}>
              {activeEntry.text}
            </p>
          </PickerBody>
        </PickerModal>
      )}

      {deleteArmed && (
        <PickerModal
          title="Delete Note"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={confirmDelete}>Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteArmed(null)}>Cancel</Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Delete {deleteArmed.title} from this character?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
