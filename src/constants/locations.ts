import type { ArmourLocationKey } from "../types/Character";

export const ARMOUR_LOCATION_ORDER = [
  "head",
  "body",
  "rightArm",
  "leftArm",
  "rightLeg",
  "leftLeg",
] as const satisfies readonly ArmourLocationKey[];

export const ARMOUR_LOCATION_LABELS = {
  head: "Head",
  body: "Body",
  rightArm: "Right Arm",
  leftArm: "Left Arm",
  rightLeg: "Right Leg",
  leftLeg: "Left Leg",
} as const satisfies Record<ArmourLocationKey, string>;
