// src/features/experience/skillAdvanceCosts.ts

import type { Character, SkillEntry } from "../../types/Character";
import {
  getAllCareerAdvances,
  getUnlockedCareerAdvances,
  type AccessibleCareerAdvance,
} from "./careerAdvanceAccess";

const SKILL_TIERS = ["trained", "+10", "+20"] as const;
type SkillTier = (typeof SKILL_TIERS)[number];

function tierIndex(level: SkillEntry["level"]): number {
  return level === "untrained" ? -1 : SKILL_TIERS.indexOf(level as SkillTier);
}

function findSkillCost(
  entries: AccessibleCareerAdvance[],
  skillId: string,
  tier: SkillTier
): number | undefined {
  return entries.find(
    (entry) =>
      entry.advance.kind === "skill" &&
      entry.advance.skillId === skillId &&
      (entry.advance.level ?? "trained") === tier
  )?.advance.cost;
}

/** Real cost to train each skill's first tier, only for skills currently unlocked for this character. */
export function getUnlockedSkillTrainingCosts(
  career: string | undefined,
  rank: string | undefined
): Map<string, number> {
  const costs = new Map<string, number>();
  for (const entry of getUnlockedCareerAdvances(career, rank)) {
    if (
      entry.advance.kind === "skill" &&
      entry.advance.skillId &&
      (entry.advance.level ?? "trained") === "trained"
    ) {
      costs.set(entry.advance.skillId, entry.advance.cost);
    }
  }
  return costs;
}

export type SkillTierAccess =
  | { status: "unlocked"; level: SkillTier; cost: number }
  | { status: "locked"; level: SkillTier }
  | { status: "not-on-career"; level: SkillTier }
  | { status: "maxed" };

/** What buying this skill's next tier looks like right now for this character. */
export function getNextSkillTierAccess(
  career: string | undefined,
  rank: string | undefined,
  skillId: string,
  currentLevel: SkillEntry["level"]
): SkillTierAccess {
  const nextIndex = tierIndex(currentLevel) + 1;
  if (nextIndex >= SKILL_TIERS.length) return { status: "maxed" };
  const nextTier = SKILL_TIERS[nextIndex];

  const unlockedCost = findSkillCost(getUnlockedCareerAdvances(career, rank), skillId, nextTier);
  if (unlockedCost !== undefined) return { status: "unlocked", level: nextTier, cost: unlockedCost };

  const existsAnywhere = findSkillCost(getAllCareerAdvances(career), skillId, nextTier) !== undefined;
  return existsAnywhere ? { status: "locked", level: nextTier } : { status: "not-on-career", level: nextTier };
}

/** Total XP currently spent training Skills — real cost first, falling back to a manually-entered one. */
export function getSkillsSpent(character: Character): number {
  const unlocked = getUnlockedCareerAdvances(character.header.career, character.header.rank);
  let total = 0;
  for (const skill of character.skills) {
    const owned = tierIndex(skill.level);
    for (let i = 0; i <= owned; i++) {
      const tier = SKILL_TIERS[i];
      total += findSkillCost(unlocked, skill.id, tier) ?? skill.manualCosts?.[tier] ?? 0;
    }
  }
  return total;
}
