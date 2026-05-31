// src/utils/characterMigration.ts
// Normalisation helpers for legacy Firestore character documents.
//
// Old documents store armour as ArmourBlock (fixed 6-location object) and
// gear as string[]. These functions convert both to the current shapes so the
// rest of the app can work with a single consistent format.

import type { ArmourLocationKey, GearItem, WornArmourPiece } from "../types/Character";

const LOCATION_KEYS: ArmourLocationKey[] = [
  "head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg",
];

export function normaliseArmour(raw: unknown): WornArmourPiece[] {
  if (Array.isArray(raw)) return raw as WornArmourPiece[];
  // Legacy ArmourBlock — convert each non-zero location into a piece
  const block = raw as Record<string, { name?: string; ap?: number; type?: string }> | null;
  if (!block) return [];
  return LOCATION_KEYS
    .filter((k) => (block[k]?.ap ?? 0) > 0)
    .map((k) => ({
      id: crypto.randomUUID(),
      name: block[k]?.type || block[k]?.name || k,
      locations: [k],
      ap: block[k]?.ap ?? 0,
      worn: true,
    }));
}

export function normaliseGear(raw: unknown): GearItem[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).map((item) => {
    if (typeof item === "string") {
      return { id: crypto.randomUUID(), name: item };
    }
    return item as GearItem;
  });
}
