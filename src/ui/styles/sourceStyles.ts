// src/ui/styles/sourceStyles.ts
// Colour classes for source-book badges, availability chips, and characteristic chips across all tabs.

import type { ChipColour } from "./colourTokens";

export function sourceChipColour(source: string): ChipColour {
  switch (source) {
    case "IH":
      return "cyan";
    case "RH":
      return "teal";
    case "BoM":
      return "red";
    case "BoJ":
      return "amber";
    case "CA":
      return "green";
    case "DH":
      return "violet";
    case "LW":
      return "orange";
    case "Asc":
      return "yellow";
    case "DotDG":
      return "pink";
    case "BSep":
      return "blue";
    case "CC":
      return "rose";
    case "H3":
      return "indigo";
    case "LD":
      return "sky";
    case "SDS":
      return "emerald";
    case "Custom":
      return "fuchsia";
    case "2nd Ed":
      return "lime";
    case "CR":
    default:
      return "slate";
  }
}

export function availabilityChipColour(availability: string | undefined): ChipColour {
  switch (availability) {
    case "Common":
      return "emerald";
    case "Average":
      return "sky";
    case "Uncommon":
      return "teal";
    case "Scarce":
      return "yellow";
    case "Rare":
      return "orange";
    case "Very Rare":
      return "rose";
    case "Extremely Rare":
      return "purple";
    case "Near Unique":
      return "pink";
    case "Unique":
      return "fuchsia";
    case "Issued Only":
      return "cyan";
    case "Adeptus Mechanicus Only":
    case "Tech-Priest Only":
      return "red";
    case "Abundant":
    case "Plentiful":
    default:
      return "slate";
  }
}

export function characteristicChipColour(characteristic: string): ChipColour {
  switch (characteristic.toLowerCase()) {
    case "ws":
    case "bs":
      return "amber";
    case "s":
    case "t":
    case "ag":
      return "green";
    case "int":
    case "per":
    case "wp":
      return "blue";
    case "fel":
      return "pink";
    default:
      return "slate";
  }
}

/**
 * Returns Tailwind text + border classes for a given SkillSource code.
 * Used inline as:
 *   <span className={`… ${sourceColour(item.source)}`}>{item.source}</span>
 */
export function sourceColour(source: string): string {
  switch (source) {
    case "CR":
      return "text-slate-300 border-slate-500";
    case "IH":
      return "text-cyan-400 border-cyan-700/50";
    case "RH":
      return "text-teal-400 border-teal-700/50";
    case "BoM":
      return "text-red-400 border-red-700/50";
    case "BoJ":
      return "text-amber-400 border-amber-700/50";
    case "CA":
      return "text-green-400 border-green-700/50";
    case "DH":
      return "text-violet-400 border-violet-700/50";
    case "LW":
      return "text-orange-400 border-orange-700/50";
    case "Asc":
      return "text-yellow-400 border-yellow-700/50";
    case "DotDG":
      return "text-pink-400 border-pink-700/50";
    case "BSep":
      return "text-blue-400 border-blue-700/50";
    case "CC":
      return "text-rose-400 border-rose-700/50";
    case "H3":
      return "text-indigo-400 border-indigo-700/50";
    case "LD":
      return "text-sky-400 border-sky-700/50";
    case "SDS":
      return "text-emerald-400 border-emerald-700/50";
    case "Custom":
      return "text-fuchsia-400 border-fuchsia-700/50";
    case "2nd Ed":
      return "text-lime-400 border-lime-700/50";
    default:
      return "text-slate-400 border-slate-600";
  }
}
