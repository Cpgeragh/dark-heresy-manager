import type { PersonalNotesCollection } from "../utils/personalNotes";
import { EntryNotesInfo } from "./EntryNotesInfo";
import type { EntryLine } from "./OwnedEntryRow";

/** Where an entry's personal note lives on the character, and whether this sheet may change it. */
export interface PersonalNotesTarget {
  collection: PersonalNotesCollection;
  id: string;
  notes?: string;
  editable: boolean;
}

/**
 * The Notes line of an owned entry: a dash when there is nothing to show or write, otherwise an
 * information icon that opens the item's own note and the player's personal notes.
 */
export function entryNotesLine(
  name: string,
  itemNotes: string | undefined,
  target: PersonalNotesTarget
): EntryLine {
  const itemNote = itemNotes?.trim();
  const hasNotes = Boolean(itemNote) || Boolean(target.notes?.trim()) || target.editable;
  return {
    info: hasNotes ? (
      <EntryNotesInfo name={name} itemNotes={itemNote} target={target} />
    ) : undefined,
  };
}
