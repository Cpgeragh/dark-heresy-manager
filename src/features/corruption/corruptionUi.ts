import {
  colourAmberFaint,
  colourEmerald,
  colourFuchsia,
  colourInactive,
  colourOrange,
  colourRose,
  colourSky,
  colourViolet,
} from "../../ui/colourTokens";
import { chipClassName } from "../../ui/Chip";
import type { CorruptionTrackEntry } from "./corruptionReference";

export function corruptionDegreeChipClass(entry: CorruptionTrackEntry): string {
  if (entry.terminal) return colourRose;
  switch (entry.degree) {
    case "Tainted":
      return colourSky;
    case "Soiled":
      return colourAmberFaint;
    case "Debased":
      return colourOrange;
    case "Profane":
      return colourFuchsia;
    default:
      return colourInactive;
  }
}

export function mutationChipClass(entry: CorruptionTrackEntry): string {
  if (entry.terminal) return colourRose;
  return entry.mutation ? colourViolet : colourInactive;
}

export function malignancyModifierChipClass(entry: CorruptionTrackEntry): string {
  if (entry.terminal) return colourRose;
  return colourEmerald;
}

export const referenceTriggerClass = chipClassName({ className: colourInactive });
export const inactiveChipClass = colourInactive;
