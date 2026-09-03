import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";

export const WEAPON_QUALITY_OPTIONS = Object.keys(WEAPON_SPECIAL_RULES).sort((a, b) =>
  a.localeCompare(b)
);

export const DAMAGE_TYPE_OPTIONS = [
  { label: "Impact", value: "I" },
  { label: "Rending", value: "R" },
  { label: "Energy", value: "E" },
  { label: "Explosive", value: "X" },
] as const;

export function isValidDiceInput(value: string): boolean {
  const match = value.match(/^(\d+)d(\d+)$/i);
  if (!match) return false;
  return Number(match[1]) > 0 && Number(match[2]) > 0;
}

export function formatDamageInput(
  baseDice: string,
  plusValue: string,
  type: string
): string {
  const plus = Number(plusValue || "0");
  const plusPart = plus > 0 ? `+${plus}` : "";
  return `${baseDice}${plusPart} ${type}`.trim();
}

export function parseDamageType(
  damage: string
): { letter: string; label: string; colour: string } | null {
  const letter = damage.trim().slice(-1).toUpperCase();
  switch (letter) {
    case "I":
      return { letter: "I", label: "Impact", colour: "text-blue-400" };
    case "R":
      return { letter: "R", label: "Rending", colour: "text-red-400" };
    case "E":
      return { letter: "E", label: "Energy", colour: "text-orange-400" };
    case "X":
      return { letter: "X", label: "Explosive", colour: "text-yellow-400" };
    default:
      return null;
  }
}

export function computeMeleeTotalDamage(damage: string, strengthBonus: number, multiplier = 1): string {
  const base = damage.replace(/\s*[IREX]$/i, "").trim();
  const match = base.match(/^(\d*d\d+)([+-]\d+)?$/i);
  if (!match) return base;
  const dice = match[1];
  const modifier = match[2] ? parseInt(match[2], 10) : 0;
  const total = modifier + strengthBonus * multiplier;
  if (total === 0) return dice;
  return `${dice}${total > 0 ? "+" : ""}${total}`;
}
