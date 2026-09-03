import {
  findCareerByName,
  type CareerData,
  type CareerRankData,
} from "../../data/reference/careerData";

export interface RankXpBand {
  min: number;
  max: number;
}

const RANK_XP_BANDS: Readonly<Record<number, RankXpBand>> = {
  1: { min: 0, max: 499 },
  2: { min: 500, max: 999 },
  3: { min: 1_000, max: 1_999 },
  4: { min: 2_000, max: 2_999 },
  5: { min: 3_000, max: 5_999 },
  6: { min: 6_000, max: 7_999 },
  7: { min: 8_000, max: 9_999 },
  8: { min: 10_000, max: 14_999 },
};

export function getRankXpBand(tier: number): RankXpBand | undefined {
  return RANK_XP_BANDS[tier];
}

export function getCurrentCareerRankData(
  career: string | undefined,
  rank: string | undefined
): CareerRankData | undefined {
  const careerData = findCareerByName(career);
  if (!careerData || !rank) return undefined;
  return careerData.ranks.find(
    (entry) => entry.name.toLocaleLowerCase() === rank.toLocaleLowerCase()
  );
}

/**
 * Resolve the branch label carried through the Career. A rank with one path
 * identifies it directly; shared ranks require the stored branch selection.
 */
export function resolveCareerPath(
  currentRank: CareerRankData,
  storedPath: string | undefined
): string | undefined {
  if (storedPath && (!currentRank.paths || currentRank.paths.includes(storedPath))) {
    return storedPath;
  }
  return currentRank.paths?.length === 1 ? currentRank.paths[0] : undefined;
}

export function getReachedCareerRanks(
  career: CareerData,
  currentRank: CareerRankData,
  storedPath?: string
): CareerRankData[] {
  const path = resolveCareerPath(currentRank, storedPath);
  return career.ranks.filter((rank) => {
    if (rank.tier > currentRank.tier) return false;
    if (!rank.paths) return true;
    if (rank.id === currentRank.id) return true;
    return path !== undefined && rank.paths.includes(path);
  });
}

export function getValidNextCareerRanks(
  career: CareerData,
  currentRank: CareerRankData,
  storedPath?: string
): CareerRankData[] {
  const nextTier = currentRank.tier + 1;
  const candidates = career.ranks.filter((rank) => rank.tier === nextTier);
  const path = resolveCareerPath(currentRank, storedPath);
  if (path) {
    return candidates.filter((rank) => !rank.paths || rank.paths.includes(path));
  }

  if (currentRank.paths && currentRank.paths.length > 1) {
    return candidates.filter(
      (rank) =>
        !rank.paths || rank.paths.some((candidatePath) => currentRank.paths?.includes(candidatePath))
    );
  }

  return candidates;
}

export interface CareerRankProgression {
  career: CareerData;
  currentRank: CareerRankData;
  currentBand: RankXpBand;
  reachedRanks: CareerRankData[];
  nextRanks: CareerRankData[];
  nextBand?: RankXpBand;
  canRankUp: boolean;
  requiresBranchChoice: boolean;
  careerPath?: string;
}

export function getCareerRankProgression(
  careerName: string | undefined,
  rankName: string | undefined,
  spentXp: number,
  storedPath?: string
): CareerRankProgression | undefined {
  const career = findCareerByName(careerName);
  const currentRank = getCurrentCareerRankData(careerName, rankName);
  if (!career || !currentRank) return undefined;
  const currentBand = getRankXpBand(currentRank.tier);
  if (!currentBand) return undefined;

  const nextRanks = getValidNextCareerRanks(career, currentRank, storedPath);
  const nextBand = nextRanks.length > 0 ? getRankXpBand(nextRanks[0].tier) : undefined;
  const careerPath = resolveCareerPath(currentRank, storedPath);

  return {
    career,
    currentRank,
    currentBand,
    reachedRanks: getReachedCareerRanks(career, currentRank, storedPath),
    nextRanks,
    nextBand,
    canRankUp: nextBand !== undefined && spentXp >= nextBand.min,
    requiresBranchChoice: nextRanks.length > 1,
    ...(careerPath ? { careerPath } : {}),
  };
}
