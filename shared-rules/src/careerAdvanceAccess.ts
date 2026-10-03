import { findCareerByName } from "./careerData.js";
import { CAREER_ADVANCES, type CareerAdvanceRef } from "./careerAdvancesReference.js";
import { ALTERNATE_RANKS, type AlternateRankAdvance } from "./alternateRankData.js";
import { makeSourceRankPurchase } from "./purchaseAttribution.js";
import type { AlternateRankSelection, TalentEntryForCost, XpPurchaseRecord } from "./types.js";

export interface AccessibleCareerAdvance {
  rankId: string;
  rankName?: string;
  alternateRankId?: string;
  advance: CareerAdvanceRef;
}

export interface MissedRankCareerAdvance {
  alternateRankId: string;
  replacedRankId: string;
  advanceIndex: number;
  advance: CareerAdvanceRef;
  purchaseCost: number;
}

function asCareerAdvance(advance: AlternateRankAdvance): CareerAdvanceRef | undefined {
  if (advance.kind === "elite-advance") return undefined;
  if (advance.kind === "skill") {
    return {
      kind: "skill",
      skillId: advance.skillId,
      level: advance.level,
      cost: advance.cost,
      prerequisites: advance.prerequisites,
      repeatable: advance.repeatable,
    };
  }
  return {
    kind: "talent",
    talentId: advance.talentId,
    specialisation: advance.specialisation,
    cost: advance.cost,
    prerequisites: advance.prerequisites,
  };
}

function getSelectedAlternateTables(
  careerId: string,
  selections: readonly AlternateRankSelection[]
): { selection: AlternateRankSelection; name: string; advances: CareerAdvanceRef[] }[] {
  return selections.flatMap((selection) => {
    const alternateRank = ALTERNATE_RANKS.find(
      (candidate) =>
        candidate.id === selection.alternateRankId && candidate.requiredCareerIds.includes(careerId)
    );
    if (!alternateRank) return [];
    return [
      {
        selection,
        name: alternateRank.name,
        advances: alternateRank.advances.flatMap((advance) => {
          const mapped = asCareerAdvance(advance);
          return mapped ? [mapped] : [];
        }),
      },
    ];
  });
}

/** Every advance across the whole career, every rank, regardless of whether reached yet. */
export function getAllCareerAdvances(
  career: string | undefined,
  alternateRanks: readonly AlternateRankSelection[] = []
): AccessibleCareerAdvance[] {
  const careerData = findCareerByName(career);
  if (!careerData) return [];
  const advancesData = CAREER_ADVANCES.find((c) => c.careerId === careerData.id);
  if (!advancesData) return [];
  const selectedTables = getSelectedAlternateTables(careerData.id, alternateRanks);
  const replacedRankIds = new Set(selectedTables.map(({ selection }) => selection.replacedRankId));
  const careerAdvances = advancesData.rankTables
    .filter((table) => !replacedRankIds.has(table.rankId))
    .flatMap((table) => table.advances.map((advance) => ({ rankId: table.rankId, advance })));
  const alternateAdvances = selectedTables.flatMap(({ selection, name, advances }) =>
    advances.map((advance) => ({
      rankId: selection.replacedRankId,
      rankName: name,
      alternateRankId: selection.alternateRankId,
      advance,
    }))
  );
  return [...careerAdvances, ...alternateAdvances];
}

/** Every advance from ranks at-or-below the character's current rank, following the correct branch. */
export function getUnlockedCareerAdvances(
  career: string | undefined,
  rank: string | undefined,
  alternateRanks: readonly AlternateRankSelection[] = []
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
  return getAllCareerAdvances(career, alternateRanks).filter((entry) =>
    unlockedRankIds.has(entry.rankId)
  );
}

function matchesTalentOrTraitAdvance(
  advance: CareerAdvanceRef,
  id: string,
  specialisation?: string
): boolean {
  if (advance.talentId !== id && advance.traitId !== id) return false;
  const advanceSpecialisation = (advance.specialisation ?? "").toLocaleLowerCase("en-GB");
  const givenSpecialisation = (specialisation ?? "").toLocaleLowerCase("en-GB");
  if (advanceSpecialisation === givenSpecialisation) return true;
  const colonIndex = givenSpecialisation.indexOf(":");
  return (
    colonIndex !== -1 && givenSpecialisation.slice(0, colonIndex).trim() === advanceSpecialisation
  );
}

/** Exact unlocked Career-table slot consumed by the next Talent or Trait purchase. */
export function getNextTalentOrTraitPurchase(
  career: string | undefined,
  rank: string | undefined,
  id: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntryForCost[],
  alternateRanks: readonly AlternateRankSelection[] = []
): XpPurchaseRecord | undefined {
  const slots = getUnlockedCareerAdvances(career, rank, alternateRanks)
    .filter(
      ({ advance }) =>
        (advance.kind === "talent" || advance.kind === "trait") &&
        matchesTalentOrTraitAdvance(advance, id, specialisation)
    )
    .flatMap(({ rankId, advance }) =>
      Array.from({ length: advance.repeatableAtThisRank ?? 1 }, () => ({
        cost: advance.cost,
        rankId,
      }))
    )
    .sort((left, right) => left.cost - right.cost);
  const owned = ownedEntries.filter((entry) =>
    matchesTalentOrTraitAdvance(
      { kind: "talent", talentId: entry.talentId, specialisation: entry.specialisation, cost: 0 },
      id,
      specialisation
    )
  ).length;
  const slot = slots[owned];
  return slot ? makeSourceRankPurchase(career, slot.rankId, slot.cost) : undefined;
}

/** Advances from replaced normal Rank tables once the following Career tier is reached. */
export function getMissedRankCareerAdvances(
  career: string | undefined,
  rank: string | undefined,
  selections: readonly AlternateRankSelection[] = []
): MissedRankCareerAdvance[] {
  const careerData = findCareerByName(career);
  if (!careerData) return [];
  const currentRank = careerData.ranks.find((entry) => entry.name === rank);
  const advancesData = CAREER_ADVANCES.find((entry) => entry.careerId === careerData.id);
  if (!currentRank || !advancesData) return [];

  return selections.flatMap((selection) => {
    const alternateRank = ALTERNATE_RANKS.find(
      (entry) =>
        entry.id === selection.alternateRankId &&
        entry.requiredCareerIds.includes(careerData.id) &&
        selection.takenAtTier >= entry.minimumRank
    );
    const replacedRank = careerData.ranks.find((entry) => entry.id === selection.replacedRankId);
    const table = advancesData.rankTables.find(
      (entry) => entry.rankId === selection.replacedRankId
    );
    if (
      !alternateRank ||
      !replacedRank ||
      replacedRank.tier !== selection.takenAtTier ||
      currentRank.tier <= selection.takenAtTier ||
      !table
    ) {
      return [];
    }

    return table.advances.map((advance, advanceIndex) => ({
      alternateRankId: selection.alternateRankId,
      replacedRankId: selection.replacedRankId,
      advanceIndex,
      advance,
      purchaseCost: advance.cost + 50,
    }));
  });
}
