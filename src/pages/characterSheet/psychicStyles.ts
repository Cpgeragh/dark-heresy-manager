// src/pages/characterSheet/psychicStyles.ts

import {
  colourInactive,
  colourViolet,
  colourEmerald,
  colourCyan,
  colourOrange,
  colourSky,
  colourFuchsia,
} from "../../ui/colourTokens";

export const disciplineColours: Record<string, string> = {
  Minor: colourViolet,
  Biomancy: colourEmerald,
  Divination: colourCyan,
  Pyromancy: colourOrange,
  Telekinetics: colourSky,
  Telepathy: colourFuchsia,
  default: colourInactive,
};

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
