// src/pages/characterSheet/CyberneticsTab/cyberneticsHelpers.ts

import type { CyberneticCraftsmanship } from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { CRAFTSMANSHIP_ORDER } from "./cyberneticsConstants";

export function nextCraftsmanship(current: CyberneticCraftsmanship): CyberneticCraftsmanship {
  const idx = CRAFTSMANSHIP_ORDER.indexOf(current);
  return CRAFTSMANSHIP_ORDER[(idx + 1) % CRAFTSMANSHIP_ORDER.length];
}

export function availableCraftsmanship(ref?: CyberneticRef): CyberneticCraftsmanship[] {
  if (!ref) return ["Common"];
  if (ref.notes?.includes("All mechadendrites are Good craftsmanship unless noted")) {
    return ["Good"];
  }

  const hasAnyQualityText = Boolean(ref.poor || ref.common || ref.good);
  if (!hasAnyQualityText) return ["Common"];

  const qualities: CyberneticCraftsmanship[] = [];
  if (ref.poor) qualities.push("Poor");
  if (ref.common || !ref.poor) qualities.push("Common");
  if (ref.good) qualities.push("Good");
  return qualities;
}

export function defaultCraftsmanship(ref?: CyberneticRef): CyberneticCraftsmanship {
  const qualities = availableCraftsmanship(ref);
  return qualities.includes("Common") ? "Common" : qualities[0];
}

export function nextAvailableCraftsmanship(
  current: CyberneticCraftsmanship,
  ref?: CyberneticRef
): CyberneticCraftsmanship {
  const qualities = availableCraftsmanship(ref);
  const idx = qualities.indexOf(current);
  return qualities[(idx + 1) % qualities.length];
}

export function craftsmanshipDescription(ref: CyberneticRef, quality: CyberneticCraftsmanship): string {
  const desc = quality === "Poor" ? ref.poor : quality === "Good" ? ref.good : ref.common;
  return desc ?? "No specific rules for this craftsmanship level.";
}
