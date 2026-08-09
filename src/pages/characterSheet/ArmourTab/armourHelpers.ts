// src/pages/characterSheet/ArmourTab/armourHelpers.ts
// Constants and pure helper functions for the Armour tab.

import type {
  ArmourCraftsmanship,
  ArmourLocationKey,
  CyberneticItem,
  TalentEntry,
  WornArmourPiece,
} from "../../../types/Character";
import type { ArmourUpgradeRef } from "../../../data/reference/armourUpgradeReference";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";

/** AP contributed by one piece to one location */
export function pieceApAt(piece: WornArmourPiece, loc: ArmourLocationKey): number {
  if (!piece.locations.includes(loc)) return 0;
  return piece.apOverrides?.[loc] ?? piece.ap;
}

/** +2 TB bonus for each bionic limb installed at this location */
export function bionicBonusAt(loc: ArmourLocationKey, cybernetics: CyberneticItem[]): number {
  return cybernetics.some((c) => c.bodyLocation?.includes(loc)) ? 2 : 0;
}

/** Flat AP from the Natural Armour trait (its specialisation stores the AP value), applies to all locations */
export function naturalArmourBonus(traits: TalentEntry[]): number {
  const entry = traits.find((t) => t.talentId === "natural-armour");
  const value = entry ? Number(entry.specialisation) : 0;
  return Number.isFinite(value) ? value : 0;
}

/** Total worn AP for a given location — highest value wins, pieces do not stack */
export function wornApAt(pieces: WornArmourPiece[], loc: ArmourLocationKey): number {
  const values = pieces
    .filter((p) => p.worn)
    .map((p) => pieceApAt(p, loc))
    .filter((ap) => ap > 0);
  return values.length === 0 ? 0 : Math.max(...values);
}

function formatKg(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0 kg";
  return `${Number(value.toFixed(2))} kg`;
}

function parseKg(value?: string): number {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  return match ? Number(match[1]) : 0;
}

function parseWeightDelta(value: string): number {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "0") return 0;
  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  return match ? Number(match[1]) : 0;
}

/** Base piece weight plus every fitted upgrade's weight delta, resolved to one real number. */
export function effectiveArmourWeight(piece: WornArmourPiece, upgradeRefs: ArmourUpgradeRef[]): string {
  const baseKg = parseKg(piece.weight);
  const deltaKg = upgradeRefs.reduce((total, ref) => total + parseWeightDelta(ref.weight), 0);
  return formatKg(baseKg + deltaKg);
}

/** "3 (Head 4)" style breakdown for pieces with per-location AP overrides; plain "3" otherwise. */
export function apBreakdown(piece: {
  ap: number;
  apOverrides?: Partial<Record<ArmourLocationKey, number>>;
}): string {
  const overrides = piece.apOverrides;
  if (!overrides || Object.keys(overrides).length === 0) return String(piece.ap);

  const byValue = new Map<number, ArmourLocationKey[]>();
  for (const [location, value] of Object.entries(overrides) as [ArmourLocationKey, number][]) {
    const list = byValue.get(value) ?? [];
    list.push(location);
    byValue.set(value, list);
  }

  const parts = [...byValue.entries()].map(([value, locations]) => {
    const set = new Set(locations);
    let label: string;
    if (set.size === 2 && set.has("rightArm") && set.has("leftArm")) {
      label = "Arms";
    } else if (set.size === 2 && set.has("rightLeg") && set.has("leftLeg")) {
      label = "Legs";
    } else if (set.size === 4 && set.has("rightArm") && set.has("leftArm") && set.has("rightLeg") && set.has("leftLeg")) {
      label = "Arms and Legs";
    } else {
      label = locations.map((loc) => ARMOUR_LOCATION_LABELS[loc]).join(", ");
    }
    return `${label} ${value}`;
  });

  return `${piece.ap} (${parts.join(", ")})`;
}

/** Rules text for a worn-armour craftsmanship grade */
export function armourCraftsmanshipDescription(craftsmanship: ArmourCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Badly fitted, designed or damaged armour. Characters wearing Poor armour take a -10 penalty to all Agility Tests.";
    case "Good":
      return "Well constructed and better fitting armour. Against the first attack in any round, the armour increases its AP by 1.";
    case "Best":
      return "Finely wrought and perfectly fitted armour. Best armour weighs half the normal amount and increases its AP by 1.";
    case "Common":
    default:
      return "Common craftsmanship armour has no additional modifier.";
  }
}

/** Rules text for a force-field craftsmanship grade */
export function forceFieldCraftsmanshipDescription(craftsmanship: ArmourCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poorly constructed field generator. Overloads on a roll of 01–15.";
    case "Good":
      return "Well constructed field generator. Overloads on a roll of 01–05.";
    case "Best":
      return "Finest available field generator. Overloads only on a roll of 1.";
    case "Common":
    default:
      return "Standard field generator. Overloads on a roll of 01–10.";
  }
}
