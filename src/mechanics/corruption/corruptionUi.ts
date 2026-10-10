import type { SegmentedTimelineSegment } from "../../ui/SegmentedTimeline";
import type { ChipColour } from "../../ui/styles/colourTokens";
import { CORRUPTION_TRACK, type CorruptionTrackEntry } from "./corruptionReference";
import { colourTextPrimary, degreeBarColour, degreeTextColour } from "../../ui/styles/colourTokens";

export function corruptionDegreeChipColour(entry: CorruptionTrackEntry): ChipColour {
  if (entry.terminal) return "rose";
  switch (entry.degree) {
    case "Tainted":
      return "sky";
    case "Soiled":
      return "amber";
    case "Debased":
      return "orange";
    case "Profane":
      return "fuchsia";
    default:
      return "slate";
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
      return degreeBarColour.first;
    case "Soiled":
      return degreeBarColour.second;
    case "Debased":
      return degreeBarColour.third;
    case "Profane":
      return degreeBarColour.fourth;
    default:
      return degreeBarColour.neutral;
  }
}

export const CORRUPTION_TIMELINE_SEGMENTS: (SegmentedTimelineSegment & { degree: string })[] =
  CORRUPTION_TRACK.filter((entry) => !entry.terminal).reduce<
    (SegmentedTimelineSegment & { degree: string })[]
  >((segments, entry, index) => {
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
    return [
      ...segments,
      { degree: entry.degree, width, colourClass: colours.bright, dimColourClass: colours.dim },
    ];
  }, []);

export const CORRUPTION_TIMELINE_TOTAL_WIDTH = CORRUPTION_TIMELINE_SEGMENTS.reduce(
  (sum, segment) => sum + segment.width,
  0
);

export function corruptionStepperClass(entry: CorruptionTrackEntry): string {
  if (entry.terminal) return degreeTextColour.terminal;
  switch (entry.degree) {
    case "Tainted":
      return degreeTextColour.first;
    case "Soiled":
      return degreeTextColour.second;
    case "Debased":
      return degreeTextColour.third;
    case "Profane":
      return degreeTextColour.fourth;
    default:
      return colourTextPrimary;
  }
}
