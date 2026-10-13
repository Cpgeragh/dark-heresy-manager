// src/utils/chatInitials.ts

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.at(-1);
  if (!first || !last) return "?";
  const letters =
    words.length > 1
      ? [...Array.from(first).slice(0, 1), ...Array.from(last).slice(0, 1)]
      : Array.from(first).slice(0, 2);
  return letters.join("").toLocaleUpperCase();
}
