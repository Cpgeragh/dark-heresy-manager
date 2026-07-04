import {
  colourAmberFaint,
  colourFuchsia,
  colourInactive,
  colourOrange,
  colourRose,
  colourSky,
} from "../../ui/colourTokens";
import { chipClassName } from "../../ui/Chip";
import { CORRUPTION_TRACK, type CorruptionTrackEntry } from "./corruptionReference";

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

export function corruptionMutationLevelLabel(entry: CorruptionTrackEntry): string {
  switch (entry.degree) {
    case "Soiled":
      return "First Test";
    case "Debased":
      return "Second Test";
    case "Profane":
      return "Third Test";
    default:
      return "None";
  }
}

function degreeSegmentColours(degree: string): { bright: string; dim: string } {
  switch (degree) {
    case "Tainted":
      return { bright: "bg-sky-500/70", dim: "bg-sky-500/35" };
    case "Soiled":
      return { bright: "bg-amber-500/70", dim: "bg-amber-500/35" };
    case "Debased":
      return { bright: "bg-orange-500/70", dim: "bg-orange-500/35" };
    case "Profane":
      return { bright: "bg-fuchsia-500/70", dim: "bg-fuchsia-500/35" };
    default:
      return { bright: "bg-slate-500/70", dim: "bg-slate-500/35" };
  }
}

export interface CorruptionTimelineSegment {
  degree: string;
  width: number;
  colourClass: string;
  dimColourClass: string;
}

export const CORRUPTION_TIMELINE_SEGMENTS: CorruptionTimelineSegment[] = CORRUPTION_TRACK.filter(
  (entry) => !entry.terminal
).reduce<CorruptionTimelineSegment[]>(
  (segments, entry, index) => {
    // The first band's stored min is 1, but 0 Corruption Points also counts as Tainted
    // (see getCorruptionTrackEntry), so anchor the first segment's start at 0.
    const start = index === 0 ? 0 : entry.min;
    const width = entry.max !== undefined ? entry.max - start + 1 : 0;
    const last = segments[segments.length - 1];
    if (last && last.degree === entry.degree) {
      last.width += width;
      return segments;
    }
    const colours = degreeSegmentColours(entry.degree);
    return [...segments, { degree: entry.degree, width, colourClass: colours.bright, dimColourClass: colours.dim }];
  },
  []
);

export const CORRUPTION_TIMELINE_TOTAL_WIDTH = CORRUPTION_TIMELINE_SEGMENTS.reduce((sum, segment) => sum + segment.width, 0);

export function corruptionStepperClass(entry: CorruptionTrackEntry): string {
  if (entry.terminal) return "text-rose-300 animate-pulse";
  switch (entry.degree) {
    case "Tainted":
      return "text-sky-200";
    case "Soiled":
      return "text-amber-200";
    case "Debased":
      return "text-orange-200";
    case "Profane":
      return "text-fuchsia-200";
    default:
      return "text-slate-100";
  }
}

export const referenceTriggerClass = chipClassName({ className: colourInactive });
export const inactiveChipClass = colourInactive;
