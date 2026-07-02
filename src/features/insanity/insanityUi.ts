import type { InsanityDisorderSeverity } from "../../types/Character";
import {
  colourAmberFaint,
  colourBlue,
  colourEmerald,
  colourFuchsia,
  colourInactive,
  colourLime,
  colourOrange,
  colourPink,
  colourRose,
  colourSky,
  colourTeal,
} from "../../ui/colourTokens";
import { chipClassName } from "../../ui/Chip";
import type { InsanityTrackEntry } from "./insanityReference";

export const severityChipClass: Record<InsanityDisorderSeverity, string> = {
  Minor: colourSky,
  Severe: colourAmberFaint,
  Acute: colourRose,
};

const DISORDER_TYPE_COLOURS: Record<string, string> = {
  "The Flesh is Weak": colourBlue,
  "Phobia": colourOrange,
  "Obsession/Compulsion": colourTeal,
  "Visions and Voices": colourFuchsia,
  "Delusion": colourLime,
  "Horrific Nightmares": colourPink,
};

export function disorderTypeChipClass(type: string): string {
  return DISORDER_TYPE_COLOURS[type] ?? colourInactive;
}

export function insanityDegreeChipClass(entry: InsanityTrackEntry): string {
  if (entry.terminal) return colourRose;
  switch (entry.degree) {
    case "Stable":
      return colourEmerald;
    case "Unsettled":
      return colourSky;
    case "Disturbed":
      return colourAmberFaint;
    case "Unhinged":
      return colourOrange;
    case "Deranged":
      return colourRose;
    default:
      return colourInactive;
  }
}

export const referenceTriggerClass = chipClassName({ className: colourInactive });
export const inactiveChipClass = colourInactive;
