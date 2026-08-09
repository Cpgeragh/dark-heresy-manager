// src/pages/characterSheet/CyberneticsTab/cyberneticsHelpers.ts

import type { CyberneticCraftsmanship } from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { CYBERNETIC_CRAFTSMANSHIP_OPTIONS } from "../../../ui/craftsmanship";

export function nextCraftsmanship(current: CyberneticCraftsmanship): CyberneticCraftsmanship {
  const idx = CYBERNETIC_CRAFTSMANSHIP_OPTIONS.indexOf(current);
  return CYBERNETIC_CRAFTSMANSHIP_OPTIONS[(idx + 1) % CYBERNETIC_CRAFTSMANSHIP_OPTIONS.length];
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

export function craftsmanshipDescription(
  ref: CyberneticRef,
  quality: CyberneticCraftsmanship
): string {
  const desc = quality === "Poor" ? ref.poor : quality === "Good" ? ref.good : ref.common;
  return desc ?? "No specific rules for this craftsmanship level.";
}

export function concealedWeaponBionicDescription(
  quality: CyberneticCraftsmanship,
  weaponType?: "ranged" | "melee"
): string {
  const base =
    "The bionic weapon functions as normal. It cannot be removed with a Disarm, and locating it requires a detailed inspection or a successful auspex scan.";

  if (quality === "Poor") {
    return "The bionic weapon functions as normal, but gains the Unreliable Quality. It cannot be removed with a Disarm, and locating it requires a detailed inspection or a successful auspex scan.";
  }
  if (quality === "Common") return base;

  if (weaponType === "ranged") {
    return `${base} It never jams or overheats; a roll that would cause either is a miss instead.`;
  }
  if (weaponType === "melee") {
    return `${base} It gains +10 to attack Tests and +1 Damage.`;
  }
  return `${base}\n\n- Ranged weapon: it never jams or overheats; a roll that would cause either is a miss instead.\n- Melee weapon: +10 to attack Tests and +1 Damage.`;
}

export function craftsmanshipValue(
  ref: CyberneticRef,
  quality: CyberneticCraftsmanship
): string {
  if (quality === "Poor") return ref.poorValue ?? ref.value;
  if (quality === "Good") return ref.goodValue ?? ref.value;
  return ref.value;
}

export function craftsmanshipAvailability(
  ref: CyberneticRef,
  quality: CyberneticCraftsmanship
): string {
  if (quality === "Poor") return ref.poorAvailability ?? ref.availability;
  if (quality === "Good") return ref.goodAvailability ?? ref.availability;
  return ref.availability;
}
