// src/pages/characterSheet/CyberneticsTab/cyberneticsHelpers.ts

import type { CyberneticCraftsmanship } from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { CRAFTSMANSHIP_ORDER } from "./cyberneticsConstants";

export function nextCraftsmanship(current: CyberneticCraftsmanship): CyberneticCraftsmanship {
  const idx = CRAFTSMANSHIP_ORDER.indexOf(current);
  return CRAFTSMANSHIP_ORDER[(idx + 1) % CRAFTSMANSHIP_ORDER.length];
}

export function craftsmanshipDescription(ref: CyberneticRef, quality: CyberneticCraftsmanship): string {
  const desc = quality === "Poor" ? ref.poor : quality === "Good" ? ref.good : ref.common;
  return desc ?? "No specific rules for this craftsmanship level.";
}
