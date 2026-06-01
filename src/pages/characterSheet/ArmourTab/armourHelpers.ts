// src/pages/characterSheet/ArmourTab/armourHelpers.ts
// Constants and pure helper functions for the Armour tab.

import type { ArmourLocationKey, CyberneticItem, WornArmourPiece } from "../../../types/Character";

export const LOCATION_LABELS: Record<ArmourLocationKey, string> = {
  head: "Head",
  body: "Body",
  rightArm: "Right Arm",
  leftArm: "Left Arm",
  rightLeg: "Right Leg",
  leftLeg: "Left Leg",
};

export const LOCATION_ORDER: ArmourLocationKey[] = [
  "head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg",
];

/** AP contributed by one piece to one location */
export function pieceApAt(piece: WornArmourPiece, loc: ArmourLocationKey): number {
  if (!piece.locations.includes(loc)) return 0;
  return piece.apOverrides?.[loc] ?? piece.ap;
}

/** +2 TB bonus for each bionic limb installed at this location */
export function bionicBonusAt(loc: ArmourLocationKey, cybernetics: CyberneticItem[]): number {
  return cybernetics.some((c) => c.bodyLocation?.includes(loc)) ? 2 : 0;
}

/** Total worn AP for a given location — highest value wins, pieces do not stack */
export function wornApAt(pieces: WornArmourPiece[], loc: ArmourLocationKey): number {
  const values = pieces
    .filter((p) => p.worn)
    .map((p) => pieceApAt(p, loc))
    .filter((ap) => ap > 0);
  return values.length === 0 ? 0 : Math.max(...values);
}

/** Human-readable list of locations a piece covers */
export function locationLabel(locations: ArmourLocationKey[]): string {
  if (locations.length === 6) return "All";
  return locations.map((l) => LOCATION_LABELS[l]).join(", ");
}
