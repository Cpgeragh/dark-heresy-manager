// src/utils/stats.ts

import { CHARACTERISTIC_ADVANCE_INCREMENT } from "../constants/gameRules";

export function calculateCharacteristicTotal(base: number, advances: number): number {
  return base + advances * CHARACTERISTIC_ADVANCE_INCREMENT;
}
