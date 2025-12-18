// src/pages/characterSheet/tabs/skills/constants.ts

import type { Characteristics } from "../../../../types/Character";
import {
  SKILL_EXPERT_THRESHOLD,
  SKILL_TRAINED_THRESHOLD,
  SKILL_BASIC_THRESHOLD,
} from "../../../../constants/gameRules";

// Re-export type from hook (so existing imports don't break)
export type { SkillWithComputed } from "../../../../hooks/useSkillComputation";

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

// Color helper for skill totals (uses imported constants)
export function getTotalColor(total: number | null): string {
  if (total === null) return "text-slate-400";
  if (total >= SKILL_EXPERT_THRESHOLD) return "text-green-400";
  if (total >= SKILL_TRAINED_THRESHOLD) return "text-amber-300";
  if (total >= SKILL_BASIC_THRESHOLD) return "text-slate-200";
  return "text-red-400";
}