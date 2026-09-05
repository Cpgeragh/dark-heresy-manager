import type { InsanityDisorderSeverity } from "../../types/Character";
import type { SegmentedTimelineSegment } from "../../ui/SegmentedTimeline";
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
} from "../../ui/styles/colourTokens";
import { chipClassName } from "../../ui/styles/chipStyles";
import { INSANITY_TRACK, type InsanityTrackEntry } from "./insanityReference";

export const severityChipClass: Record<InsanityDisorderSeverity, string> = {
  Minor: colourSky,
  Severe: colourAmberFaint,
  Acute: colourRose,
};

const DISORDER_TYPE_COLOURS: Record<string, string> = {
  "The Flesh is Weak": colourBlue,
  Phobia: colourOrange,
  "Obsession/Compulsion": colourTeal,
  "Visions and Voices": colourFuchsia,
  Delusion: colourLime,
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
      return colourFuchsia;
    default:
      return colourInactive;
  }
}

export function insanityDisorderLevelChipClass(entry: InsanityTrackEntry): string {
  switch (entry.degree) {
    case "Stable":
    case "Unsettled":
      return colourEmerald;
    case "Disturbed":
      return colourSky;
    case "Unhinged":
      return colourFuchsia;
    case "Deranged":
      return colourOrange;
    default:
      return colourInactive;
  }
}

export function insanityDisorderLevelLabel(entry: InsanityTrackEntry): string {
  switch (entry.degree) {
    case "Disturbed":
      return "Minor";
    case "Unhinged":
      return "Severe";
    case "Deranged":
      return "Acute";
    default:
      return "None";
  }
}

function degreeSegmentColours(degree: string): { bright: string; dim: string } {
  switch (degree) {
    case "Stable":
      return { bright: "bg-emerald-500/70", dim: "bg-emerald-500/35" };
    case "Unsettled":
      return { bright: "bg-sky-500/70", dim: "bg-sky-500/35" };
    case "Disturbed":
      return { bright: "bg-amber-500/70", dim: "bg-amber-500/35" };
    case "Unhinged":
      return { bright: "bg-orange-500/70", dim: "bg-orange-500/35" };
    case "Deranged":
      return { bright: "bg-fuchsia-500/70", dim: "bg-fuchsia-500/35" };
    default:
      return { bright: "bg-slate-500/70", dim: "bg-slate-500/35" };
  }
}

export const INSANITY_TIMELINE_SEGMENTS: (SegmentedTimelineSegment & { degree: string })[] =
  INSANITY_TRACK.filter((entry) => !entry.terminal).reduce<
    (SegmentedTimelineSegment & { degree: string })[]
  >((segments, entry) => {
    const width = entry.max !== undefined ? entry.max - entry.min + 1 : 0;
    const last = segments[segments.length - 1];
    if (last && last.degree === entry.degree) {
      last.width += width;
      return segments;
    }
    const colours = degreeSegmentColours(entry.degree);
    return [
      ...segments,
      { degree: entry.degree, width, colourClass: colours.bright, dimColourClass: colours.dim },
    ];
  }, []);

export const INSANITY_TIMELINE_TOTAL_WIDTH = INSANITY_TIMELINE_SEGMENTS.reduce(
  (sum, segment) => sum + segment.width,
  0
);

export function insanityStepperClass(entry: InsanityTrackEntry): string {
  if (entry.terminal) return "text-rose-300 animate-pulse";
  switch (entry.degree) {
    case "Stable":
      return "text-slate-100";
    case "Unsettled":
      return "text-sky-200";
    case "Disturbed":
      return "text-amber-200";
    case "Unhinged":
      return "text-orange-200";
    case "Deranged":
      return "text-fuchsia-200";
    default:
      return "text-slate-100";
  }
}

export const referenceTriggerClass = chipClassName({ className: colourInactive });
export const inactiveChipClass = colourInactive;
