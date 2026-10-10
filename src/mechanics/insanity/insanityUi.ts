import type { InsanityDisorderSeverity } from "../../types/Character";
import type { SegmentedTimelineSegment } from "../../ui/SegmentedTimeline";
import type { ChipColour } from "../../ui/styles/colourTokens";
import { INSANITY_TRACK, type InsanityTrackEntry } from "./insanityReference";

export const severityChipColour: Record<InsanityDisorderSeverity, ChipColour> = {
  Minor: "sky",
  Severe: "amber",
  Acute: "rose",
};

const DISORDER_TYPE_COLOURS: Record<string, ChipColour> = {
  "The Flesh is Weak": "blue",
  Phobia: "orange",
  "Obsession/Compulsion": "teal",
  "Visions and Voices": "fuchsia",
  Delusion: "lime",
  "Horrific Nightmares": "pink",
};

export function disorderTypeChipColour(type: string): ChipColour {
  return DISORDER_TYPE_COLOURS[type] ?? "slate";
}

export function insanityDegreeChipColour(entry: InsanityTrackEntry): ChipColour {
  if (entry.terminal) return "rose";
  switch (entry.degree) {
    case "Stable":
      return "emerald";
    case "Unsettled":
      return "sky";
    case "Disturbed":
      return "amber";
    case "Unhinged":
      return "orange";
    case "Deranged":
      return "fuchsia";
    default:
      return "slate";
  }
}

export function insanityDisorderLevelChipColour(entry: InsanityTrackEntry): ChipColour {
  switch (entry.degree) {
    case "Stable":
    case "Unsettled":
      return "emerald";
    case "Disturbed":
      return "sky";
    case "Unhinged":
      return "fuchsia";
    case "Deranged":
      return "orange";
    default:
      return "slate";
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
