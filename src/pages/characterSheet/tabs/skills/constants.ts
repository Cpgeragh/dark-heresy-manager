// src/pages/characterSheet/tabs/skills/constants.ts

import type { Characteristics, SkillEntry } from "../../../../types/Character";
import type { CharField } from "../../../../utils/characterFactory";

export type SortMode = "category" | "characteristic" | "name" | "total";

export const GROUP_ORDER: (keyof Characteristics)[] = [
  "ws",
  "bs",
  "s",
  "t",
  "ag",
  "int",
  "per",
  "wp",
  "fel",
];

export const CHAR_LABEL: Record<keyof Characteristics, string> = {
  ws: "WS",
  bs: "BS",
  s: "S",
  t: "T",
  ag: "Ag",
  int: "Int",
  per: "Per",
  wp: "WP",
  fel: "Fel",
};

export const CHAR_FULL_LABEL: Record<keyof Characteristics, string> = {
  ws: "Weapon Skill (WS)",
  bs: "Ballistic Skill (BS)",
  s: "Strength (S)",
  t: "Toughness (T)",
  ag: "Agility (Ag)",
  int: "Intelligence (Int)",
  per: "Perception (Per)",
  wp: "Willpower (WP)",
  fel: "Fellowship (Fel)",
};

// Color helper
export function getTotalColor(total: number | null): string {
  if (total === null) return "text-slate-400";
  if (total >= 40) return "text-green-400";
  if (total >= 30) return "text-amber-300";
  if (total >= 20) return "text-slate-200";
  return "text-red-400";
}

// Computed skill type
export type SkillWithComputed = SkillEntry & {
  total: number | null;
  half: number | null;
  full: number | null;
  opposed: number | null;
};

// Compute totals (moved from SkillsTab)
export function computeTotal(
  skill: SkillEntry,
  getCharField: (key: keyof Characteristics) => CharField
): number | null {
  const charField = getCharField(skill.characteristic);
  const charTotal = charField.base + charField.advances;
  const misc = skill.miscModifier ?? 0;

  const levelMod =
    skill.level === "trained"
      ? 0
      : skill.level === "+10"
      ? 10
      : skill.level === "+20"
      ? 20
      : -20;

  return charTotal + levelMod + misc;
}