// src/pages/CharacterSheet/PsychicTab/psychicStyles.ts
// Separate from its consumers because it's shared between PsychicTab and PowerCard, not inlined into either.

import type { CSSProperties } from "react";
import type { PsychicDiscipline } from "../../../data/reference/psychicReference";
import type { GlowChipColour } from "../../../ui/chips/GlowChip";
import type { ChipColour } from "../../../ui/styles/colourTokens";

export const disciplineColours: Record<string, ChipColour> = {
  Minor: "violet",
  Biomancy: "emerald",
  Divination: "cyan",
  Pyromancy: "orange",
  Telekinetics: "sky",
  Telepathy: "fuchsia",
  default: "slate",
};

export type MajorPsychicDiscipline = Exclude<PsychicDiscipline, "Minor">;

export const disciplineGlowColours: Record<MajorPsychicDiscipline, GlowChipColour> = {
  Biomancy: "emerald",
  Divination: "cyan",
  Pyromancy: "orange",
  Telekinetics: "sky",
  Telepathy: "fuchsia",
};

export const psychicSelectionSourceColours = {
  talent: "amber",
  psyRating: "indigo",
} as const satisfies Record<string, ChipColour>;

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
