// src/pages/characterSheet/SkillsTab/skillsConstants.ts

import type { Characteristics } from "../../../types/Character";

export type SortMode = "category" | "characteristic" | "name" | "total";

// Re-export type from hook (so existing imports don't break)
export type { SkillWithComputed } from "../../../hooks/useSkillComputation";

// Characteristic display order
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

// Short labels for characteristics
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

// Full labels for characteristics
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

export function getSkillGroupCharacteristics(
  skills: readonly { characteristic: keyof Characteristics }[]
): (keyof Characteristics)[] {
  return [...new Set(skills.map((skill) => skill.characteristic))];
}
