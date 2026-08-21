// src/features/experience/weaponTrainingAdvanceCosts.ts

import { TALENT_LIST } from "../../data/talentData";
import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import type { Character, WeaponTrainingTalentId } from "../../types/Character";
import { getUnlockedCareerAdvances } from "./careerAdvanceAccess";

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

/** Real cost to train this weapon group, only if currently unlocked for this character's career/rank. */
export function getWeaponTrainingCost(
  career: string | undefined,
  rank: string | undefined,
  id: WeaponTrainingTalentId
): number | undefined {
  const meta = findWeaponTrainingMeta(id);
  if (!meta) return undefined;
  const match = getUnlockedCareerAdvances(career, rank).find(
    (entry) =>
      entry.advance.kind === "talent" &&
      entry.advance.talentId === meta.talentId &&
      (entry.advance.specialisation ?? "").toLocaleLowerCase() === meta.specialisation.toLocaleLowerCase()
  );
  return match?.advance.cost;
}

/** Total number of Exotic Weapon Training slots currently unlocked for this character's career/rank. */
export function getUnlockedExoticWeaponSlots(career: string | undefined, rank: string | undefined): number {
  return getUnlockedCareerAdvances(career, rank)
    .filter((entry) => entry.advance.kind === "talent" && entry.advance.talentId === "exotic-weapon-training")
    .reduce((total, entry) => total + (entry.advance.repeatableAtThisRank ?? 1), 0);
}

/** Total XP currently spent on Weapon Training — the five fixed groups (real cost, or a DM's manual override) plus manually-costed Exotic weapons. */
export function getWeaponTrainingSpent(character: Character): number {
  const { career, rank } = character.header;
  const { trained, manualCosts, exoticWeapons } = character.weaponTraining;
  const fixedGroupsSpent = trained.reduce(
    (total, id) => total + (getWeaponTrainingCost(career, rank, id) ?? manualCosts?.[id] ?? 0),
    0
  );
  const exoticSpent = exoticWeapons.reduce((total, weapon) => total + weapon.cost, 0);
  return fixedGroupsSpent + exoticSpent;
}
