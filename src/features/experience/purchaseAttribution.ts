import { findCareerByName } from "../../data/careerData";
import type { XpPurchaseRecord } from "../../types/Character";

export interface CurrentCareerRank {
  careerId: string;
  rankId: string;
}

/** Stable ids for the character's currently selected Career and named Rank. */
export function getCurrentCareerRank(
  career: string | undefined,
  rank: string | undefined
): CurrentCareerRank | undefined {
  const careerData = findCareerByName(career);
  if (!careerData || !rank) return undefined;
  const rankData = careerData.ranks.find(
    (entry) => entry.name.toLocaleLowerCase() === rank.toLocaleLowerCase()
  );
  return rankData ? { careerId: careerData.id, rankId: rankData.id } : undefined;
}

/** Purchase made from a specific named rank on the Career table. */
export function makeSourceRankPurchase(
  career: string | undefined,
  sourceRankId: string,
  cost: number
): XpPurchaseRecord {
  const careerData = findCareerByName(career);
  return {
    cost,
    ...(careerData ? { careerId: careerData.id } : {}),
    sourceRankId,
  };
}

/** Purchase with no named Career-table source, attributed to the current rank. */
export function makeCurrentRankPurchase(
  career: string | undefined,
  rank: string | undefined,
  cost: number
): XpPurchaseRecord {
  const current = getCurrentCareerRank(career, rank);
  return {
    cost,
    ...(current
      ? { careerId: current.careerId, purchasedAtRankId: current.rankId }
      : {}),
  };
}
