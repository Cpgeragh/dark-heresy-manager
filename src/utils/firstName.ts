/** Keep first-name input compact and capitalize its first character. */
export function formatFirstNameInput(value: string): string {
  const compact = value.replace(/\s/g, "");
  if (!compact) return "";

  const [firstCharacter, ...remainingCharacters] = Array.from(compact);
  return firstCharacter.toLocaleUpperCase() + remainingCharacters.join("");
}
