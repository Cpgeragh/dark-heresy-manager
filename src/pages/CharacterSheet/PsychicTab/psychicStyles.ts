// src/pages/CharacterSheet/PsychicTab/psychicStyles.ts
// Separate from its consumers because it's shared between PsychicTab and PowerCard, not inlined into either.

import type { CSSProperties } from "react";
import {
  colourGlowActive,
  colourGlowInactive,
  colourInactive,
  colourViolet,
  colourEmerald,
  colourCyan,
  colourOrange,
  colourSky,
  colourFuchsia,
} from "../../../ui/styles/colourTokens";

export const disciplineColours: Record<string, string> = {
  Minor: colourViolet,
  Biomancy: colourEmerald,
  Divination: colourCyan,
  Pyromancy: colourOrange,
  Telekinetics: colourSky,
  Telepathy: colourFuchsia,
  default: colourInactive,
};

export const disciplineActiveColours: Record<string, string> = {
  Minor: colourViolet,
  Biomancy: colourGlowActive.emerald,
  Divination: colourGlowActive.cyan,
  Pyromancy: colourGlowActive.orange,
  Telekinetics: colourGlowActive.sky,
  Telepathy: colourGlowActive.fuchsia,
  default: colourInactive,
};

export const disciplineInactiveColours: Record<string, string> = {
  Biomancy: colourGlowInactive.emerald,
  Divination: colourGlowInactive.cyan,
  Pyromancy: colourGlowInactive.orange,
  Telekinetics: colourGlowInactive.sky,
  Telepathy: colourGlowInactive.fuchsia,
  default: colourInactive,
};

export const psychicSelectionSourceColours = {
  talent: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  psyRating: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
} as const;

/** CSS custom properties for the Psy Rating pulse, scaled across supported ratings. */
export function psyRatingPulseVars(psyRating: number): CSSProperties {
  const capped = Math.max(1, Math.min(6, psyRating));
  const lo: Record<number, [number, number]> = {
    1: [6, 0.35],
    2: [9, 0.45],
    3: [12, 0.55],
    4: [15, 0.65],
    5: [19, 0.75],
    6: [24, 0.9],
  };
  const hi: Record<number, [number, number]> = {
    1: [10, 0.55],
    2: [14, 0.65],
    3: [18, 0.75],
    4: [22, 0.85],
    5: [27, 0.92],
    6: [32, 0.98],
  };
  const [loBlur, loOpacity] = lo[capped];
  const [hiBlur, hiOpacity] = hi[capped];
  return {
    "--glow-lo": `0 0 ${loBlur}px rgba(129,140,248,${loOpacity})`,
    "--glow-hi": `0 0 ${hiBlur}px rgba(129,140,248,${hiOpacity})`,
  } as CSSProperties;
}
