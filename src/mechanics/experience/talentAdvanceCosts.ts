// src/mechanics/experience/talentAdvanceCosts.ts

import type { AlternateRankSelection, TalentEntry, XpPurchaseRecord } from "../../types/Character";
import {
  findCareerByName,
  getAllCareerAdvances,
  getNextTalentOrTraitPurchase,
  getUnlockedCareerAdvances,
} from "shared-rules";

function matches(
  advance: { talentId?: string; traitId?: string; specialisation?: string },
  id: string,
  specialisation?: string
): boolean {
  if (advance.talentId !== id && advance.traitId !== id) return false;
  const advanceSpec = (advance.specialisation ?? "").toLocaleLowerCase();
  const givenSpec = (specialisation ?? "").toLocaleLowerCase();
  if (advanceSpec === givenSpec) return true;
  const colonIndex = givenSpec.indexOf(":");
  return colonIndex !== -1 && givenSpec.slice(0, colonIndex).trim() === advanceSpec;
}

function isTalentOrTraitAdvance(advance: { kind: string }): boolean {
  return advance.kind === "talent" || advance.kind === "trait";
}

function getUnlockedTalentSlots(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  alternateRanks: readonly AlternateRankSelection[]
): { cost: number; rankId: string }[] {
  return getUnlockedCareerAdvances(career, rank, alternateRanks)
    .filter(
      (entry) =>
        isTalentOrTraitAdvance(entry.advance) && matches(entry.advance, talentId, specialisation)
    )
    .flatMap((entry) =>
      Array.from({ length: entry.advance.repeatableAtThisRank ?? 1 }, () => ({
        cost: entry.advance.cost,
        rankId: entry.rankId,
      }))
    )
    .sort((a, b) => a.cost - b.cost);
}

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
  const owned = ownedEntries.filter((entry) => matches(entry, talentId, specialisation)).length;
  const counts = new Map<number, number>();
  for (const slot of getUnlockedTalentSlots(
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
  const unlockedSlotCount = getUnlockedCareerAdvances(career, rank, alternateRanks)
    .filter(
      (entry) =>
        isTalentOrTraitAdvance(entry.advance) && matches(entry.advance, talentId, specialisation)
    )
    .reduce((total, entry) => total + (entry.advance.repeatableAtThisRank ?? 1), 0);
  if (unlockedSlotCount === 0) return false;
  const owned = ownedEntries.filter((entry) => matches(entry, talentId, specialisation)).length;
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
    if (!isTalentOrTraitAdvance(entry.advance) || !matches(entry.advance, talentId, specialisation))
      continue;
    const name = entry.rankName ?? rankNames.get(entry.rankId);
    if (name && !seen.has(name)) {
      seen.add(name);
      chips.push(name);
    }
  }
  return chips;
}
