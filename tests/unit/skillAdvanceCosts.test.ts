import { describe, it, expect } from "vitest";
import {
  getUnlockedSkillTrainingCosts,
  getNextSkillTierAccess,
  getSkillsSpent,
} from "../../src/features/experience/skillAdvanceCosts";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character, SkillEntry } from "../../src/types/Character";

function skill(overrides: Partial<SkillEntry> = {}): SkillEntry {
  return {
    id: "awareness",
    name: "Awareness",
    characteristic: "per",
    level: "untrained",
    category: "General",
    advanced: false,
    source: "CR",
    ...overrides,
  } as SkillEntry;
}

function makeCharacter(overrides: {
  career?: string;
  rank?: string;
  skills?: SkillEntry[];
}): Character {
  const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
  return {
    ...data,
    id: "test-char",
    header: { ...data.header, career: overrides.career ?? "", rank: overrides.rank ?? "" },
    skills: overrides.skills ?? [],
  };
}

describe("getUnlockedSkillTrainingCosts", () => {
  it("includes Awareness at its real Conscript cost", () => {
    const costs = getUnlockedSkillTrainingCosts("Guardsman", "Conscript");
    expect(costs.get("awareness")).toBe(100);
  });

  it("does not include a skill that's only trainable at a higher rank than reached", () => {
    // Command first appears at Veteran, tier 5.
    const costs = getUnlockedSkillTrainingCosts("Guardsman", "Conscript");
    expect(costs.has("command")).toBe(false);
  });

  it("does include it once that rank is reached", () => {
    const costs = getUnlockedSkillTrainingCosts("Guardsman", "Veteran");
    expect(costs.get("command")).toBe(100);
  });
});

describe("getNextSkillTierAccess", () => {
  it("is unlocked with the real cost when the next tier is on an already-reached rank", () => {
    // Awareness +10 is a Scout-rank advance.
    expect(getNextSkillTierAccess("Guardsman", "Scout", "awareness", "trained")).toEqual({
      status: "unlocked",
      level: "+10",
      cost: 100,
    });
  });

  it("is locked when the next tier exists for this career but hasn't been reached yet", () => {
    expect(getNextSkillTierAccess("Guardsman", "Conscript", "awareness", "trained")).toEqual({
      status: "locked",
      level: "+10",
    });
  });

  it("is not-on-career for a skill this career's tables never mention", () => {
    expect(getNextSkillTierAccess("Guardsman", "Sniper", "wrangling", "untrained")).toEqual({
      status: "not-on-career",
      level: "trained",
    });
  });

  it("is maxed once a skill is already at +20", () => {
    expect(getNextSkillTierAccess("Guardsman", "Sniper", "awareness", "+20")).toEqual({
      status: "maxed",
    });
  });
});

describe("getSkillsSpent", () => {
  it("is zero for a character with no trained skills", () => {
    expect(getSkillsSpent(makeCharacter({ career: "Guardsman", rank: "Conscript" }))).toBe(0);
  });

  it("sums the real cost of every tier reached", () => {
    // Awareness Trained (Conscript, 100) + Awareness +10 (Scout, 100) = 200
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Scout",
      skills: [skill({ level: "+10" })],
    });
    expect(getSkillsSpent(char)).toBe(200);
  });

  it("falls back to a manually-entered cost when a tier isn't on the career table", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      skills: [skill({ id: "wrangling", name: "Wrangling", level: "trained", manualCosts: { trained: 250 } })],
    });
    expect(getSkillsSpent(char)).toBe(250);
  });

  it("prefers the real cost over a stored manual one when both exist for the same tier", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      skills: [skill({ level: "trained", manualCosts: { trained: 9999 } })],
    });
    expect(getSkillsSpent(char)).toBe(100);
  });
});
