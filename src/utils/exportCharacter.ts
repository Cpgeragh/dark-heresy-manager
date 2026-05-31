// src/utils/exportCharacter.ts
// Pure utility for triggering a JSON download of a character document.

import type { CharacterDocument } from "../types/Firestore";

export function exportCharacterJson(character: CharacterDocument): void {
  const { id, ...data } = character;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${character.header?.characterName ?? "character"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
