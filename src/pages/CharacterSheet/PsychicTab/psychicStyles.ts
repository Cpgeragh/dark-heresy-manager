// src/pages/CharacterSheet/PsychicTab/psychicStyles.ts
// Separate from its consumers because it's shared between PsychicTab and PowerCard, not inlined into either.

import type { CSSProperties } from "react";
import {
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
  Biomancy: "border-emerald-500/60 bg-emerald-950/50 text-emerald-300 font-semibold",
  Divination: "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 font-semibold",
  Pyromancy: "border-orange-500/60 bg-orange-950/50 text-orange-300 font-semibold",
  Telekinetics: "border-sky-500/60 bg-sky-950/50 text-sky-300 font-semibold",
  Telepathy: "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300 font-semibold",
  default: colourInactive,
};

export const disciplineInactiveColours: Record<string, string> = {
  Biomancy: "border-emerald-700/50 bg-emerald-950/15 text-emerald-400/50",
  Divination: "border-cyan-700/50 bg-cyan-950/15 text-cyan-400/50",
  Pyromancy: "border-orange-700/50 bg-orange-950/15 text-orange-400/50",
  Telekinetics: "border-sky-700/50 bg-sky-950/15 text-sky-400/50",
  Telepathy: "border-fuchsia-700/50 bg-fuchsia-950/15 text-fuchsia-400/50",
  default: colourInactive,
};

export const psychicSelectionSourceColours = {
  talent: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  psyRating: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
} as const;

export function psyRatingGlow(psyRating: number): string {
  const capped = Math.max(0, Math.min(6, psyRating));
  switch (capped) {
    case 1:
      return "shadow-[0_0_6px_rgba(129,140,248,0.35)]";
    case 2:
      return "shadow-[0_0_9px_rgba(129,140,248,0.45)]";
    case 3:
      return "shadow-[0_0_12px_rgba(129,140,248,0.55)]";
    case 4:
      return "shadow-[0_0_15px_rgba(129,140,248,0.65)]";
    case 5:
      return "shadow-[0_0_19px_rgba(129,140,248,0.75)]";
    case 6:
      return "shadow-[0_0_24px_rgba(129,140,248,0.9)]";
    default:
      return "shadow-none";
  }
}

/** TEST ONLY, for the pulse-glow live preview, not the confirmed design. */
export function psyRatingPulseVars(psyRating: number): CSSProperties {
  const capped = Math.max(1, Math.min(6, psyRating));
  const lo: Record<number, [number, number]> = {
    1: [6, 0.35], 2: [9, 0.45], 3: [12, 0.55],
    4: [15, 0.65], 5: [19, 0.75], 6: [24, 0.9],
  };
  const hi: Record<number, [number, number]> = {
    1: [10, 0.55], 2: [14, 0.65], 3: [18, 0.75],
    4: [22, 0.85], 5: [27, 0.92], 6: [32, 0.98],
  };
  const [loBlur, loOpacity] = lo[capped];
  const [hiBlur, hiOpacity] = hi[capped];
  return {
    "--glow-lo": `0 0 ${loBlur}px rgba(129,140,248,${loOpacity})`,
    "--glow-hi": `0 0 ${hiBlur}px rgba(129,140,248,${hiOpacity})`,
  } as CSSProperties;
}
