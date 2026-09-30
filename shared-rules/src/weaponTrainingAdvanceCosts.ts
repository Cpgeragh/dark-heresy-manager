// shared-rules/src/weaponTrainingAdvanceCosts.ts

import { TALENT_LIST } from "./talentData.js";
import { WEAPON_TRAINING_GROUPS } from "./weaponTrainingData.js";
import type {
  CharacterForWeaponTrainingCosts,
  AlternateRankSelection,
  WeaponTrainingTalentId,
  XpPurchaseRecord,
} from "./types.js";
import { getUnlockedCareerAdvances } from "./careerAdvanceAccess.js";
import { makeSourceRankPurchase } from "./purchaseAttribution.js";

function findWeaponTrainingMeta(
  id: WeaponTrainingTalentId
): { talentId: string; specialisation: string } | undefined {
  for (const group of WEAPON_TRAINING_GROUPS) {
    const item = group.items.find((entry) => entry.id === id);
    if (!item) continue;
    const talent = TALENT_LIST.find((entry) => entry.name === group.label);
    if (talent) return { talentId: talent.id, specialisation: item.display };
  }
  return undefined;
}

/** Exact Career-table slot consumed when training this fixed weapon group. */
export function getWeaponTrainingPurchase(
  career: string | undefined,
  rank: string | undefined,
  id: WeaponTrainingTalentId,
  alternateRanks: readonly AlternateRankSelection[] = []
): XpPurchaseRecord | undefined {
  const meta = findWeaponTrainingMeta(id);
  if (!meta) return undefined;
  const match = getUnlockedCareerAdvances(career, rank, alternateRanks).find(
    (entry) =>
      entry.advance.kind === "talent" &&
      entry.advance.talentId === meta.talentId &&
      (entry.advance.specialisation ?? "").toLocaleLowerCase() ===
        meta.specialisation.toLocaleLowerCase()
  );
  return match ? makeSourceRankPurchase(career, match.rankId, match.advance.cost) : undefined;
}

/** Real cost to train this weapon group, only if currently unlocked for this character's career/rank. */
export function getWeaponTrainingCost(
  career: string | undefined,
  rank: string | undefined,
  id: WeaponTrainingTalentId,
  alternateRanks: readonly AlternateRankSelection[] = []
): number | undefined {
  return getWeaponTrainingPurchase(career, rank, id, alternateRanks)?.cost;
}

/** Total XP currently spent on Weapon Training: the five fixed groups (real cost, or a DM's manual override) plus manually-costed Exotic weapons. */
export function getWeaponTrainingSpent(character: CharacterForWeaponTrainingCosts): number {
  const { career, rank } = character.header;
  const alternateRanks = character.experience?.alternateRanks ?? [];
  const { trained, manualCosts, xpPurchases, exoticWeapons } = character.weaponTraining;
  const fixedGroupsSpent = trained.reduce(
    (total, id) =>
      total +
      (xpPurchases?.[id]?.cost ??
        getWeaponTrainingCost(career, rank, id, alternateRanks) ??
        manualCosts?.[id] ??
        0),
    0
  );
  const exoticSpent = exoticWeapons.reduce(
    (total, weapon) => total + (weapon.xpPurchase?.cost ?? weapon.cost),
    0
  );
  return fixedGroupsSpent + exoticSpent;
}
