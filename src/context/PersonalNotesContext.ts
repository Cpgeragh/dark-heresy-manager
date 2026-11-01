import { createContext } from "react";
import type { PersonalNotesCollection } from "../utils/personalNotes";

/** Saves the player's own note on one entry of the open character, and resolves to false when the save fails. */
export type SavePersonalNotes = (
  collection: PersonalNotesCollection,
  id: string,
  text: string
) => Promise<boolean>;

export const PersonalNotesContext = createContext<SavePersonalNotes | null>(null);
