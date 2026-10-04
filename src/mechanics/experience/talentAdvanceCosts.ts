// src/mechanics/experience/talentAdvanceCosts.ts

import type { AlternateRankSelection, TalentEntry, XpPurchaseRecord } from "../../types/Character";
import {
  findCareerByName,
  getAllCareerAdvances,
  getNextTalentOrTraitPurchase,
  getUnlockedCareerAdvances,
  getUnlockedTalentOrTraitSlots,
  isTalentOrTraitAdvance,
  matchesTalentOrTraitAdvance,
} from "shared-rules";

/** Exact Career-table slot consumed by the next real purchase. */
export function getNextTalentPurchase(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[] = []
): XpPurchaseRecord | undefined {
  return getNextTalentOrTraitPurchase(
    career,
    rank,
    talentId,
    specialisation,
    ownedEntries,
    alternateRanks
  );
}

/** The unbought slots for this talent, grouped by price and listed cheapest first. */
export function getRemainingTalentSlots(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[] = []
): { cost: number; count: number }[] {
  const owned = ownedEntries.filter((entry) =>
    matchesTalentOrTraitAdvance(entry, talentId, specialisation)
  ).length;
  const counts = new Map<number, number>();
  for (const slot of getUnlockedTalentOrTraitSlots(
    career,
    rank,
    talentId,
    specialisation,
    alternateRanks
  ).slice(owned)) {
    counts.set(slot.cost, (counts.get(slot.cost) ?? 0) + 1);
  }
  return [...counts.entries()].map(([cost, count]) => ({ cost, count }));
}

/** Real cost of the next copy of this talent, only if a currently-unlocked slot is still unbought. */
export function getNextTalentCost(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[] = []
): number | undefined {
  return getNextTalentPurchase(career, rank, talentId, specialisation, ownedEntries, alternateRanks)
    ?.cost;
}

/** True if this talent has real career-table entries within reached ranks, but every one of those slots is already owned. */
export function isTalentMaxedAtCurrentRank(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[] = []
): boolean {
  const unlockedSlotCount = getUnlockedTalentOrTraitSlots(
    career,
    rank,
    talentId,
    specialisation,
    alternateRanks
  ).length;
  if (unlockedSlotCount === 0) return false;
  const owned = ownedEntries.filter((entry) =>
    matchesTalentOrTraitAdvance(entry, talentId, specialisation)
  ).length;
  return owned >= unlockedSlotCount;
}

/** True if this talent has at least one specialisation (or its base, unspecialised form) with a currently-buyable slot. */
export function hasAnyUnlockedTalentOption(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  ownedEntries: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[] = []
): boolean {
  const specialisations = new Set(
    getUnlockedCareerAdvances(career, rank, alternateRanks)
      .filter(
        (entry) =>
          isTalentOrTraitAdvance(entry.advance) &&
          (entry.advance.talentId === talentId || entry.advance.traitId === talentId)
      )
      .map((entry) => entry.advance.specialisation ?? "")
  );
  for (const spec of specialisations) {
    if (
      getNextTalentCost(career, rank, talentId, spec || undefined, ownedEntries, alternateRanks) !==
      undefined
    )
      return true;
  }
  return false;
}

/** Every rank (display name) this talent appears at anywhere in the career's full table, unlocked or not. */
export function getTalentRankChips(
  career: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  alternateRanks: readonly AlternateRankSelection[] = []
): string[] {
  const careerData = findCareerByName(career);
  if (!careerData) return [];
  const rankNames = new Map(careerData.ranks.map((rank) => [rank.id, rank.name]));
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const entry of getAllCareerAdvances(career, alternateRanks)) {
    if (
      !isTalentOrTraitAdvance(entry.advance) ||
      !matchesTalentOrTraitAdvance(entry.advance, talentId, specialisation)
    )
      continue;
    const name = entry.rankName ?? rankNames.get(entry.rankId);
    if (name && !seen.has(name)) {
      seen.add(name);
      chips.push(name);
    }
  }
  return chips;
}
