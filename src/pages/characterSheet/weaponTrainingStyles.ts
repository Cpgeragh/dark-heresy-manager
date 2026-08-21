// src/pages/characterSheet/weaponTrainingStyles.ts

import type { CSSProperties } from "react";

export const WEAPON_TRAINING_GROUP_RGB: Record<string, string> = {
  "Basic Weapon Training": "45,212,191", // teal-400
  "Heavy Weapon Training": "167,139,250", // violet-400
  "Melee Weapon Training": "251,146,60", // orange-400
  "Pistol Training": "56,189,248", // sky-400
  "Thrown Weapon Training": "251,191,36", // amber-400
};

export const WEAPON_TRAINING_GROUP_ACTIVE_STYLE: Record<string, string> = {
  "Basic Weapon Training": "border-teal-500/60 bg-teal-950/50 text-teal-300 font-semibold",
  "Heavy Weapon Training": "border-violet-500/60 bg-violet-950/50 text-violet-300 font-semibold",
  "Melee Weapon Training": "border-orange-500/60 bg-orange-950/50 text-orange-300 font-semibold",
  "Pistol Training": "border-sky-500/60 bg-sky-950/50 text-sky-300 font-semibold",
  "Thrown Weapon Training": "border-amber-500/60 bg-amber-950/50 text-amber-300 font-semibold",
};

export const WEAPON_TRAINING_GROUP_INACTIVE_STYLE: Record<string, string> = {
  "Basic Weapon Training": "border-teal-700/50 bg-teal-950/15 text-teal-400/50",
  "Heavy Weapon Training": "border-violet-700/50 bg-violet-950/15 text-violet-400/50",
  "Melee Weapon Training": "border-orange-700/50 bg-orange-950/15 text-orange-400/50",
  "Pistol Training": "border-sky-700/50 bg-sky-950/15 text-sky-400/50",
  "Thrown Weapon Training": "border-amber-700/50 bg-amber-950/15 text-amber-400/50",
};

export const EXOTIC_TRAINING_RGB = "232,121,249"; // fuchsia-400
export const EXOTIC_TRAINING_ACTIVE_STYLE = "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300 font-semibold";
export const EXOTIC_TRAINING_INACTIVE_STYLE = "border-fuchsia-700/50 bg-fuchsia-950/15 text-fuchsia-400/50";

/** CSS custom properties driving the shared `animate-psy-pulse` keyframe (see tailwind.config.cjs). */
export function weaponTrainingPulseVars(rgb: string): CSSProperties {
  return {
    "--glow-lo": `0 0 1px rgba(255,255,255,1), 0 0 4px rgba(${rgb},1), 0 0 14px rgba(${rgb},0.8)`,
    "--glow-hi": `0 0 2px rgba(255,255,255,1), 0 0 6px rgba(${rgb},1), 0 0 22px rgba(${rgb},0.9)`,
  } as CSSProperties;
}
