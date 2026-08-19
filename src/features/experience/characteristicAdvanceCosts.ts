// src/features/experience/characteristicAdvanceCosts.ts

import type { Character, Characteristics } from "../../types/Character";
import { findCareerByName } from "../../data/careerData";
import { CAREER_ADVANCES, type CharacteristicKey } from "../../data/reference/careerAdvancesReference";

const TIER_KEYS = ["simple", "intermediate", "trained", "expert"] as const;

/**
 * Cost of each of the 4 Characteristic Advance tiers for this career, in
 * order. Undefined entries mean no cost data exists yet for that career.
 */
export function getCharacteristicTierCosts(
  career: string | undefined,
  statKey: CharacteristicKey
): (number | undefined)[] {
  const careerData = findCareerByName(career);
  const advances = careerData && CAREER_ADVANCES.find((c) => c.careerId === careerData.id);
  const costs = advances?.characteristicAdvances[statKey];
  if (!costs) return [undefined, undefined, undefined, undefined];
  return TIER_KEYS.map((tier) => costs[tier]);
}

/** Total XP currently spent on Characteristic Advances across all nine stats. */
export function getCharacteristicAdvancesSpent(character: Character): number {
  const statKeys = Object.keys(character.characteristics) as (keyof Characteristics)[];
  return statKeys.reduce((total, statKey) => {
    const tierCosts = getCharacteristicTierCosts(character.header.career, statKey);
    const advances = character.characteristics[statKey].advances;
    let spent = 0;
    for (let i = 0; i < advances; i++) spent += tierCosts[i] ?? 0;
    return total + spent;
  }, 0);
}
