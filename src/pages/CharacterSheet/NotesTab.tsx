// src/pages/CharacterSheet/NotesTab.tsx

import { useRef, useState } from "react";
import type { NoteEntry } from "../../types/Character";
import { AddButton } from "../../ui/buttons/AddButton";
import { Button } from "../../ui/buttons/Button";
import { CardOverlayButton } from "../../ui/buttons/CardOverlayButton";
import { Chip } from "../../ui/chips/Chip";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import {
  uiInlineRow,
  editableInputClass,
  editableTextareaClass,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiTextDescription,
} from "../../ui/styles/editableStyles";
import { uiCardTapHeader } from "../../ui/styles/buttonStyles";
import { uiLayerLocal } from "../../ui/styles/layerStyles";
import { createLocalId } from "../../utils/createLocalId";
import type { PatchOptions } from "../../hooks/useOptimisticOverlay";

interface NotesTabProps {
  notes: NoteEntry[];
  editable: boolean;
  onSave: (value: NoteEntry[], options?: PatchOptions) => void | Promise<void>;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function NotesTab({ notes, editable, onSave }: NotesTabProps) {
  const entries = notes;
  const sorted = [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const [query, setQuery] = useState("");
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
    onSave([...entries, newEntry], { optimistic: true });
    closeAll();
  }

  function submitEdit() {
    if (!canSubmit || !activeEntry) return;
    onSave(
      entries.map((entry) =>
        entry.id === activeEntry.id
          ? {
              ...entry,
              title: title.trim(),
              text: text.trim(),
              updatedAt: new Date().toISOString(),
            }
          : entry
      ),
      { optimistic: true }
    );
    closeAll();
  }

  function confirmDelete() {
    if (!deleteArmed) return;
    onSave(
      entries.filter((entry) => entry.id !== deleteArmed.id),
      { optimistic: true }
    );
    setDeleteArmed(null);
  }

  const normalisedQuery = query.trim().toLowerCase();
  const filtered = normalisedQuery
    ? sorted.filter(
        (entry) =>
          entry.title.toLowerCase().includes(normalisedQuery) ||
          entry.text.toLowerCase().includes(normalisedQuery)
      )
    : sorted;

  return (
    <div className="space-y-3">
      {(editable || entries.length > 0) && (
        <div className={`${uiInlineRow} justify-end`}>
          {entries.length > 0 && (
            <input
              type="search"
              name="notes-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes…"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className={editableInputClass(true) + " w-40 lg:w-56"}
            />
          )}
          {editable && <AddButton label="Add Note" onClick={openAdd} />}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No notes yet.</p>
      ) : filtered.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No notes match your search.</p>
      ) : (
        <div className="grid grid-cols-2 items-start gap-3">
          {[
            filtered.slice(0, Math.ceil(filtered.length / 2)),
            filtered.slice(Math.ceil(filtered.length / 2)),
          ].map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map((entry) => (
                <div
                  key={entry.id}
                  className={`${uiSectionShell} ${uiCardTapHeader} relative p-4 lg:p-5`}
                >
                  <CardOverlayButton
                    label={`Open note ${entry.title}`}
                    onClick={() => openView(entry)}
                  />
                  <div className="pointer-events-none relative flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 text-left lg:flex-1">
                      <span className={uiTextLabel}>{entry.title}</span>
                      <p
                        className={`mt-2 text-sm ${uiTextBody} leading-relaxed line-clamp-3 min-h-[4.3rem]`}
                      >
                        {entry.text}
                      </p>
                      <Chip size="sm" colour="cyan" className="mt-2">
                        {formatDate(entry.updatedAt)}
                      </Chip>
                    </div>
                    {editable && (
                      <div
                        className={`pointer-events-auto relative ${uiLayerLocal} flex shrink-0 justify-end gap-1.5 order-first lg:order-2`}
                      >
                        <Button size="xs" onClick={() => openEdit(entry)}>
                          Edit
                        </Button>
                        <RemoveButton onClick={() => setDeleteArmed(entry)} label="Remove" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
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
              autoComplete="off"
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
              autoComplete="off"
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
            <p className={`${uiTextDescription} whitespace-pre-wrap`}>{activeEntry.text}</p>
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
              <Button variant="primary" onClick={confirmDelete}>
                Delete
              </Button>
              <Button variant="neutral" onClick={() => setDeleteArmed(null)}>
                Cancel
              </Button>
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
