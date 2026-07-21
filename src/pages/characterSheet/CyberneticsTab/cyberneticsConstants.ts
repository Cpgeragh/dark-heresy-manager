// src/pages/characterSheet/CyberneticsTab/cyberneticsConstants.ts

import type { ArmourLocationKey } from "../../../types/Character";

export const LOCATION_DISPLAY: Partial<Record<ArmourLocationKey, string>> = {
  head: "Head",
  body: "Body",
  leftArm: "Left Arm",
  rightArm: "Right Arm",
  leftLeg: "Left Leg",
  rightLeg: "Right Leg",
};
