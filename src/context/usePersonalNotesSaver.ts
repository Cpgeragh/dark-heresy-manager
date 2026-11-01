import { useContext } from "react";
import { PersonalNotesContext } from "./PersonalNotesContext";

/** The save function for personal notes on the open character, or null outside a character sheet. */
export function usePersonalNotesSaver() {
  return useContext(PersonalNotesContext);
}
