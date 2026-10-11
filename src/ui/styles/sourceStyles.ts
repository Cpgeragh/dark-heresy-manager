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
