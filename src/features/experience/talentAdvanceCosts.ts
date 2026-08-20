// src/features/experience/talentAdvanceCosts.ts

import type { TalentEntry } from "../../types/Character";
import { getAllCareerAdvances, getUnlockedCareerAdvances } from "./careerAdvanceAccess";
import { findCareerByName } from "../../data/careerData";

function matches(
  advance: { talentId?: string; traitId?: string; specialisation?: string },
  id: string,
  specialisation?: string
): boolean {
  return (
    (advance.talentId === id || advance.traitId === id) &&
    (advance.specialisation ?? "").toLocaleLowerCase() === (specialisation ?? "").toLocaleLowerCase()
  );
}

function isTalentOrTraitAdvance(advance: { kind: string }): boolean {
  return advance.kind === "talent" || advance.kind === "trait";
}

/** Real cost of the next copy of this talent, only if a currently-unlocked slot is still unbought. */
export function getNextTalentCost(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[]
): number | undefined {
  const slots = getUnlockedCareerAdvances(career, rank)
    .filter((entry) => isTalentOrTraitAdvance(entry.advance) && matches(entry.advance, talentId, specialisation))
    .flatMap((entry) => Array(entry.advance.repeatableAtThisRank ?? 1).fill(entry.advance.cost))
    .sort((a, b) => a - b);
  const owned = ownedEntries.filter((entry) => matches(entry, talentId, specialisation)).length;
  return slots[owned];
}

/** True if this talent has real career-table entries within reached ranks, but every one of those slots is already owned. */
export function isTalentMaxedAtCurrentRank(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[]
): boolean {
  const unlockedSlotCount = getUnlockedCareerAdvances(career, rank)
    .filter((entry) => isTalentOrTraitAdvance(entry.advance) && matches(entry.advance, talentId, specialisation))
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
  ownedEntries: readonly TalentEntry[]
): boolean {
  const specialisations = new Set(
    getUnlockedCareerAdvances(career, rank)
      .filter(
        (entry) =>
          isTalentOrTraitAdvance(entry.advance) &&
          (entry.advance.talentId === talentId || entry.advance.traitId === talentId)
      )
      .map((entry) => entry.advance.specialisation ?? "")
  );
  for (const spec of specialisations) {
    if (getNextTalentCost(career, rank, talentId, spec || undefined, ownedEntries) !== undefined) return true;
  }
  return false;
}

/** Every rank (display name) this talent appears at anywhere in the career's full table, unlocked or not. */
export function getTalentRankChips(
  career: string | undefined,
  talentId: string,
  specialisation: string | undefined
): string[] {
  const careerData = findCareerByName(career);
  if (!careerData) return [];
  const rankNames = new Map(careerData.ranks.map((rank) => [rank.id, rank.name]));
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const entry of getAllCareerAdvances(career)) {
    if (!isTalentOrTraitAdvance(entry.advance) || !matches(entry.advance, talentId, specialisation)) continue;
    const name = rankNames.get(entry.rankId);
    if (name && !seen.has(name)) {
      seen.add(name);
      chips.push(name);
    }
  }
  return chips;
}
