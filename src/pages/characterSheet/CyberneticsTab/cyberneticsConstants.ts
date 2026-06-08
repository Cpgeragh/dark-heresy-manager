// src/pages/characterSheet/CyberneticsTab/cyberneticsConstants.ts

import type { CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";

export const CRAFTSMANSHIP_ORDER: CyberneticCraftsmanship[] = ["Poor", "Common", "Good"];

export const CRAFTSMANSHIP_STYLE: Record<CyberneticCraftsmanship, string> = {
  Poor: "border-red-600   bg-red-900/30   text-red-400",
  Common: "border-green-600 bg-green-900/30 text-green-400",
  Good: "border-amber-500 bg-amber-900/30 text-amber-300",
};

export const LOCATION_DISPLAY: Partial<Record<ArmourLocationKey, string>> = {
  leftArm: "Left Arm",
  rightArm: "Right Arm",
  leftLeg: "Left Leg",
  rightLeg: "Right Leg",
};
