// src/mechanics/experience/talentAdvanceCosts.ts

import type {
  AlternateRankSelection,
  Character,
  TalentEntry,
  XpPurchaseRecord,
} from "../../types/Character";
import { getAllCareerAdvances, getUnlockedCareerAdvances } from "./careerAdvanceAccess";
import { findCareerByName } from "../../data/reference/careerData";
import { makeSourceRankPurchase } from "./purchaseAttribution";

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

/** Exact Career-table slot consumed by the next real purchase. */
export function getNextTalentPurchase(
  career: string | undefined,
  rank: string | undefined,
  talentId: string,
  specialisation: string | undefined,
  ownedEntries: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[] = []
): XpPurchaseRecord | undefined {
  const slots = getUnlockedCareerAdvances(career, rank, alternateRanks)
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
  const owned = ownedEntries.filter((entry) => matches(entry, talentId, specialisation)).length;
  const slot = slots[owned];
  return slot ? makeSourceRankPurchase(career, slot.rankId, slot.cost) : undefined;
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

/** Total XP currently spent on Talents and Traits: real cost first, falling back to a manually-entered one. Granted entries are free by construction. */
export function getTalentsSpent(character: Character): number {
  const career = character.header.career;
  const rank = character.header.rank;
  const alternateRanks = character.experience.alternateRanks ?? [];
  const counted: TalentEntry[] = [];
  let total = 0;
  for (const entry of [
    ...character.talentsAndTraits.talents,
    ...character.talentsAndTraits.traits,
  ]) {
    if (entry.grantedByTalentEntryUid) continue;
    const legacyRealCost = getNextTalentCost(
      career,
      rank,
      entry.talentId,
      entry.specialisation,
      counted,
      alternateRanks
    );
    total += entry.xpPurchase?.cost ?? legacyRealCost ?? entry.manualCost ?? 0;
    counted.push(entry);
  }
  return total;
}
