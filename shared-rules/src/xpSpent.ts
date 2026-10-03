import { getCharacteristicAdvancesSpent } from "./characteristicAdvanceCosts.js";
import { getSkillsSpent } from "./skillAdvanceCosts.js";
import { getTalentsSpent } from "./talentAdvanceCosts.js";
import type {
  AlternateRankSelection,
  CharacterForCharacteristicCosts,
  CharacterForSkillCosts,
  CharacterForTalentCosts,
  CharacterForWeaponTrainingCosts,
  XpPurchaseRecord,
} from "./types.js";
import { getWeaponTrainingSpent } from "./weaponTrainingAdvanceCosts.js";

interface RankAdvanceForSpentXp {
  cost: number;
}

interface RankForSpentXp {
  advances: RankAdvanceForSpentXp[];
}

interface TransactionForSpentXp {
  type: string;
  amount: number;
}

interface EliteAdvanceForSpentXp {
  xpPurchase?: XpPurchaseRecord;
}

export interface CharacterForSpentXp {
  header?: CharacterForTalentCosts["header"];
  characteristics?: CharacterForCharacteristicCosts["characteristics"];
  skills?: CharacterForSkillCosts["skills"];
  talentsAndTraits?: {
    talents?: CharacterForTalentCosts["talentsAndTraits"]["talents"];
    traits?: CharacterForTalentCosts["talentsAndTraits"]["traits"];
    eliteAdvances?: EliteAdvanceForSpentXp[];
  };
  weaponTraining?: CharacterForWeaponTrainingCosts["weaponTraining"];
  experience?: {
    ranks?: RankForSpentXp[];
    transactions?: TransactionForSpentXp[];
    alternateRanks?: AlternateRankSelection[];
  };
}

/** Total XP represented by every persisted XP-bearing purchase on a character. */
export function getSpentXp(character: CharacterForSpentXp): number {
  const header = character.header ?? {};
  const experience = character.experience ?? {};
  const ranksSpent = (experience.ranks ?? []).reduce(
    (total, rank) =>
      total + rank.advances.reduce((rankTotal, advance) => rankTotal + advance.cost, 0),
    0
  );
  const transactionSpent = (experience.transactions ?? []).reduce(
    (total, transaction) => (transaction.type === "spend" ? total + transaction.amount : total),
    0
  );
  const characteristicSpent = character.characteristics
    ? getCharacteristicAdvancesSpent({
        header,
        characteristics: character.characteristics,
        experience,
      })
    : 0;
  const skillSpent = getSkillsSpent({ skills: character.skills ?? [] });
  const talentsAndTraits = character.talentsAndTraits;
  const talentSpent = getTalentsSpent({
    header,
    experience,
    talentsAndTraits: {
      talents: talentsAndTraits?.talents ?? [],
      traits: talentsAndTraits?.traits ?? [],
    },
  });
  const eliteAdvanceSpent = (talentsAndTraits?.eliteAdvances ?? []).reduce(
    (total, entry) => total + (entry.xpPurchase?.cost ?? 0),
    0
  );
  const weaponTrainingSpent = character.weaponTraining
    ? getWeaponTrainingSpent({ header, experience, weaponTraining: character.weaponTraining })
    : 0;

  return (
    ranksSpent +
    transactionSpent +
    characteristicSpent +
    skillSpent +
    talentSpent +
    eliteAdvanceSpent +
    weaponTrainingSpent
  );
}
