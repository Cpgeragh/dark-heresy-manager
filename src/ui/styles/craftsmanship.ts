import type { CyberneticCraftsmanship, StandardCraftsmanship } from "../../types/Character";
import type { ChipColour } from "./colourTokens";
import { colourToggleSelected } from "./colourTokens";

export const CRAFTSMANSHIP_OPTIONS = [
  "Poor",
  "Common",
  "Good",
  "Best",
] as const satisfies readonly StandardCraftsmanship[];
export const CYBERNETIC_CRAFTSMANSHIP_OPTIONS = CRAFTSMANSHIP_OPTIONS.filter(
  (option): option is CyberneticCraftsmanship => option !== "Best"
);

export const CRAFTSMANSHIP_COLOUR: Record<StandardCraftsmanship, ChipColour> = {
  Poor: "red",
  Common: "slate",
  Good: "emerald",
  Best: "amber",
};

export const CRAFTSMANSHIP_STYLE: Record<StandardCraftsmanship, string> = {
  Poor: colourToggleSelected[CRAFTSMANSHIP_COLOUR.Poor],
  Common: colourToggleSelected[CRAFTSMANSHIP_COLOUR.Common],
  Good: colourToggleSelected[CRAFTSMANSHIP_COLOUR.Good],
  Best: colourToggleSelected[CRAFTSMANSHIP_COLOUR.Best],
};
