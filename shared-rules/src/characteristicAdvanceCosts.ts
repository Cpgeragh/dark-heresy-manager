// shared-rules/src/characteristicAdvanceCosts.ts

import type {
  CharacterForCharacteristicCosts,
  CharacteristicAdvanceTier,
  Characteristics,
} from "./types.js";
import { findCareerByName } from "./careerData.js";
import { CAREER_ADVANCES, type CharacteristicKey } from "./careerAdvancesReference.js";
import { ALTERNATE_RANKS } from "./alternateRankData.js";
import type { AlternateRankSelection } from "./types.js";

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
 * career (e.g. Tech-Priest's Fellowship); distinct from "not transcribed
 * yet".
 */
export function getCharacteristicTierCosts(
  career: string | undefined,
  statKey: CharacteristicKey,
  alternateRanks: readonly AlternateRankSelection[] = []
): (number | null | undefined)[] {
  const override = [...alternateRanks]
    .reverse()
    .map((selection) => ALTERNATE_RANKS.find((rank) => rank.id === selection.alternateRankId))
    .find((rank) => rank?.characteristicAdvanceOverrides?.[statKey])
    ?.characteristicAdvanceOverrides?.[statKey];
  if (override) return CHARACTERISTIC_ADVANCE_TIERS.map((tier) => override[tier]);

  const careerData = findCareerByName(career);
  const advances = careerData && CAREER_ADVANCES.find((c) => c.careerId === careerData.id);
  const costs = advances?.characteristicAdvances[statKey];
  if (!costs) return [undefined, undefined, undefined, undefined];
  return CHARACTERISTIC_ADVANCE_TIERS.map((tier) => costs[tier]);
}

/** Total XP currently spent on Characteristic Advances across all nine stats. */
export function getCharacteristicAdvancesSpent(character: CharacterForCharacteristicCosts): number {
  const statKeys = Object.keys(character.characteristics) as (keyof Characteristics)[];
  return statKeys.reduce((total, statKey) => {
    const tierCosts = getCharacteristicTierCosts(
      character.header.career,
      statKey,
      character.experience?.alternateRanks
    );
    const advances = character.characteristics[statKey].advances;
    const purchases = character.characteristics[statKey].advancePurchases;
    let spent = 0;
    for (let i = 0; i < advances; i++) {
      spent += purchases?.[CHARACTERISTIC_ADVANCE_TIERS[i]]?.cost ?? tierCosts[i] ?? 0;
    }
    return total + spent;
  }, 0);
}
