// src/mechanics/experience/characteristicAdvanceCosts.ts

import type { Character, CharacteristicAdvanceTier, Characteristics } from "../../types/Character";
import { findCareerByName } from "../../data/reference/careerData";
import {
  CAREER_ADVANCES,
  type CharacteristicKey,
} from "../../data/reference/careerAdvancesReference";

export const CHARACTERISTIC_ADVANCE_TIERS = [
  "simple",
  "intermediate",
  "trained",
  "expert",
] as const satisfies readonly CharacteristicAdvanceTier[];

/**
 * Cost of each of the 4 Characteristic Advance tiers for this career, in
 * order. Undefined entries mean no cost data exists yet for that career.
 * Null entries mean this characteristic is confirmed unbuyable for this
 * career (e.g. Tech-Priest's Fellowship) — distinct from "not transcribed
 * yet".
 */
export function getCharacteristicTierCosts(
  career: string | undefined,
  statKey: CharacteristicKey
): (number | null | undefined)[] {
  const careerData = findCareerByName(career);
  const advances = careerData && CAREER_ADVANCES.find((c) => c.careerId === careerData.id);
  const costs = advances?.characteristicAdvances[statKey];
  if (!costs) return [undefined, undefined, undefined, undefined];
  return CHARACTERISTIC_ADVANCE_TIERS.map((tier) => costs[tier]);
}

/** Total XP currently spent on Characteristic Advances across all nine stats. */
export function getCharacteristicAdvancesSpent(character: Character): number {
  const statKeys = Object.keys(character.characteristics) as (keyof Characteristics)[];
  return statKeys.reduce((total, statKey) => {
    const tierCosts = getCharacteristicTierCosts(character.header.career, statKey);
    const advances = character.characteristics[statKey].advances;
    const purchases = character.characteristics[statKey].advancePurchases;
    let spent = 0;
    for (let i = 0; i < advances; i++) {
      spent += purchases?.[CHARACTERISTIC_ADVANCE_TIERS[i]]?.cost ?? tierCosts[i] ?? 0;
    }
    return total + spent;
  }, 0);
}
