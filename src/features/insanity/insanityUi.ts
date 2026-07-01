import type { InsanityDisorderSeverity } from "../../types/Character";
import {
  colourAmberFaint,
  colourEmerald,
  colourInactive,
  colourOrange,
  colourRose,
  colourSky,
} from "../../ui/colourTokens";
import { chipClassName } from "../../ui/Chip";
import type { InsanityTrackEntry } from "./insanityReference";

export const severityChipClass: Record<InsanityDisorderSeverity, string> = {
  Minor: colourSky,
  Severe: colourAmberFaint,
  Acute: colourRose,
};

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
