// shared-rules/src/weaponTrainingAdvanceCosts.ts

import { TALENT_LIST } from "./talentData.js";
import { WEAPON_TRAINING_GROUPS, isPistolOnlyExoticWeaponTraining } from "./weaponTrainingData.js";
import type {
  CharacterForWeaponTrainingCosts,
  AlternateRankSelection,
  WeaponTrainingTalentId,
  XpPurchaseRecord,
} from "./types.js";
import { getUnlockedCareerAdvances } from "./careerAdvanceAccess.js";
import { makeSourceRankPurchase } from "./purchaseAttribution.js";

export interface ExoticWeaponTrainingPurchase {
  name: string;
  purchase: XpPurchaseRecord;
}

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

/** Unlocked Exotic Weapon Training choices from the active Career tables. */
export function getExoticWeaponTrainingPurchases(
  career: string | undefined,
  rank: string | undefined,
  alternateRanks: readonly AlternateRankSelection[] = []
): ExoticWeaponTrainingPurchase[] {
  const pistolOnly = alternateRanks.some(
    (selection) => selection.alternateRankId === "metallican-gunslinger"
  );
  const purchases = new Map<string, ExoticWeaponTrainingPurchase>();

  for (const entry of getUnlockedCareerAdvances(career, rank, alternateRanks)) {
    if (
      entry.advance.kind !== "talent" ||
      entry.advance.talentId !== "exotic-weapon-training" ||
      !entry.advance.specialisation
    ) {
      continue;
    }
    const name = entry.advance.specialisation.trim();
    if (pistolOnly && !isPistolOnlyExoticWeaponTraining(name)) continue;

    const key = name.toLocaleLowerCase();
    const purchase = makeSourceRankPurchase(career, entry.rankId, entry.advance.cost);
    const current = purchases.get(key);
    if (!current || purchase.cost < current.purchase.cost) {
      purchases.set(key, { name, purchase });
    }
  }

  return [...purchases.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Exact Career-table purchase for an unlocked Exotic Weapon Training specialisation. */
export function getExoticWeaponTrainingPurchase(
  career: string | undefined,
  rank: string | undefined,
  name: string,
  alternateRanks: readonly AlternateRankSelection[] = []
): XpPurchaseRecord | undefined {
  const normalisedName = name.trim().toLocaleLowerCase();
  return getExoticWeaponTrainingPurchases(career, rank, alternateRanks).find(
    (entry) => entry.name.toLocaleLowerCase() === normalisedName
  )?.purchase;
}

/** Total XP currently spent on Weapon Training, including Career and DM-priced Exotic purchases. */
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
