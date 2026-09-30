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
export {
  ALTERNATE_RANKS,
  type AlternateRankData,
  type AlternateRankAdvance,
  type AlternateRankSkillAdvance,
  type AlternateRankTalentAdvance,
  type AlternateRankEliteAdvance,
} from "./alternateRankData.js";
export { ELITE_ADVANCES, type EliteAdvanceData } from "./eliteAdvanceData.js";
export { SkillSource } from "./skillSource.js";
export { FAITH_TALENT_RULES, type FaithTalentRulesData } from "./faithTalentData.js";
export {
  TALENT_LIST,
  type TalentData,
  type TalentBehaviour,
  type FaithTalentGroup,
} from "./talentData.js";
export {
  WEAPON_TRAINING_GROUPS,
  type WeaponTrainingItem,
  type WeaponTrainingGroup,
} from "./weaponTrainingData.js";
export {
  getWeaponTrainingPurchase,
  getWeaponTrainingCost,
  getWeaponTrainingSpent,
} from "./weaponTrainingAdvanceCosts.js";
export {
  getAllCareerAdvances,
  getUnlockedCareerAdvances,
  type AccessibleCareerAdvance,
} from "./careerAdvanceAccess.js";
export {
  getCurrentCareerRank,
  makeSourceRankPurchase,
  makeCurrentRankPurchase,
  type CurrentCareerRank,
} from "./purchaseAttribution.js";
export {
  getUnlockedSkillTrainingCosts,
  getNextSkillTierAccess,
  getSkillsSpent,
  type SkillTierAccess,
} from "./skillAdvanceCosts.js";
export type {
  CharacteristicAdvanceTier,
  Characteristics,
  CharField,
  XpPurchaseRecord,
  CharacterForCharacteristicCosts,
  SkillAdvanceLevel,
  SkillEntryForCost,
  CharacterForSkillCosts,
  WeaponTrainingTalentId,
  CharacterForWeaponTrainingCosts,
  AlternateRankSelection,
} from "./types.js";
