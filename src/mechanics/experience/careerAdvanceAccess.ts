// src/mechanics/experience/careerAdvanceAccess.ts

import { findCareerByName } from "../../data/reference/careerData";
import {
  CAREER_ADVANCES,
  type CareerAdvanceRef,
} from "../../data/reference/careerAdvancesReference";

export interface AccessibleCareerAdvance {
  rankId: string;
  advance: CareerAdvanceRef;
}

/** Every advance across the whole career, every rank, regardless of whether reached yet. */
export function getAllCareerAdvances(career: string | undefined): AccessibleCareerAdvance[] {
  const careerData = findCareerByName(career);
  if (!careerData) return [];
  const advancesData = CAREER_ADVANCES.find((c) => c.careerId === careerData.id);
  if (!advancesData) return [];
  return advancesData.rankTables.flatMap((table) =>
    table.advances.map((advance) => ({ rankId: table.rankId, advance }))
  );
}

/** Every advance from ranks at-or-below the character's current rank, following the correct branch. */
export function getUnlockedCareerAdvances(
  career: string | undefined,
  rank: string | undefined
): AccessibleCareerAdvance[] {
  const careerData = findCareerByName(career);
  if (!careerData) return [];
  const currentRankData = careerData.ranks.find((r) => r.name === rank);
  if (!currentRankData) return [];
  const myPath = currentRankData.paths?.[0];
  const unlockedRankIds = new Set(
    careerData.ranks
      .filter(
        (r) =>
          r.tier <= currentRankData.tier &&
          (!r.paths || (myPath !== undefined && r.paths.includes(myPath)))
      )
      .map((r) => r.id)
  );
  return getAllCareerAdvances(career).filter((entry) => unlockedRankIds.has(entry.rankId));
}
