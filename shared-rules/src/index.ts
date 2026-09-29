// shared-rules/src/index.ts
// Public entry point. Both src/ (via the "shared-rules" file: dependency) and
// functions/ import from this file, never from the individual files directly,
// so the package's real public surface stays deliberate.

export {
  CHARACTERISTIC_ADVANCE_TIERS,
  getCharacteristicTierCosts,
  getCharacteristicAdvancesSpent,
} from "./characteristicAdvanceCosts.js";
export { findCareerByName, CAREER_LIST } from "./careerData.js";
export { CAREER_ADVANCES, type CharacteristicKey } from "./careerAdvancesReference.js";
export { SkillSource } from "./skillSource.js";
export type {
  CharacteristicAdvanceTier,
  Characteristics,
  CharField,
  XpPurchaseRecord,
  CharacterForCharacteristicCosts,
} from "./types.js";
