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
export {
  ELITE_ADVANCES,
  getEliteAdvanceGrantedSkillLevel,
  getEliteAdvanceSkillCost,
  getEliteAdvanceWeaponTrainingCost,
  getEliteAdvanceWeaponTrainingId,
  type EliteAdvanceData,
  type EliteAdvanceUnlockedAdvance,
} from "./eliteAdvanceData.js";
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
  PISTOL_ONLY_EXOTIC_WEAPON_TRAINING,
  isPistolOnlyExoticWeaponTraining,
  type WeaponTrainingItem,
  type WeaponTrainingGroup,
} from "./weaponTrainingData.js";
export {
  getExoticWeaponTrainingPurchase,
  getExoticWeaponTrainingPurchases,
  getWeaponTrainingPurchase,
  getWeaponTrainingCost,
  getWeaponTrainingSpent,
  type ExoticWeaponTrainingPurchase,
} from "./weaponTrainingAdvanceCosts.js";
export {
  getAllCareerAdvances,
  getMissedRankCareerAdvances,
  getNextTalentOrTraitPurchase,
  getUnlockedCareerAdvances,
  type AccessibleCareerAdvance,
  type MissedRankCareerAdvance,
} from "./careerAdvanceAccess.js";
export {
  getCurrentCareerRank,
  makeSourceRankPurchase,
  makeCurrentRankPurchase,
  type CurrentCareerRank,
} from "./purchaseAttribution.js";
export { getCurrentCareerRankData, getValidNextCareerRanks } from "./careerRankProgression.js";
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
  TalentEntryForCost,
  CharacterForTalentCosts,
  WeaponTrainingTalentId,
  CharacterForWeaponTrainingCosts,
  AlternateRankSelection,
} from "./types.js";
