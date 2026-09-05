import { describe, it, expect } from "vitest";
import {
  getNextTalentPurchase,
  getTalentsSpent,
} from "../../src/mechanics/experience/talentAdvanceCosts";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character, TalentEntry } from "../../src/types/Character";

function talentEntry(overrides: Partial<TalentEntry> = {}): TalentEntry {
  return {
    uid: overrides.uid ?? "t1",
    talentId: "sound-constitution",
    name: "Sound Constitution",
    ...overrides,
  };
}

function makeCharacter(overrides: {
  career?: string;
  rank?: string;
  talents?: TalentEntry[];
  traits?: TalentEntry[];
}): Character {
  const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
  return {
    ...data,
    id: "test-char",
    header: { ...data.header, career: overrides.career ?? "", rank: overrides.rank ?? "" },
    talentsAndTraits: {
      ...data.talentsAndTraits,
      talents: overrides.talents ?? [],
      traits: overrides.traits ?? [],
    },
  };
}

describe("getTalentsSpent", () => {
  it("returns the exact source-rank slot consumed by a real purchase", () => {
    expect(
      getNextTalentPurchase("Guardsman", "Conscript", "sound-constitution", undefined, [])
    ).toEqual({ cost: 100, careerId: "guardsman", sourceRankId: "conscript" });
  });

  it("is zero for a character with no talents or traits", () => {
    expect(getTalentsSpent(makeCharacter({ career: "Guardsman", rank: "Conscript" }))).toBe(0);
  });

  // Real Guardsman Conscript data: Sound Constitution, 100 XP, repeatableAtThisRank: 3.
  it("sums the real cheapest-slot-first cost across multiple repeatable purchases", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      talents: [talentEntry({ uid: "s1" }), talentEntry({ uid: "s2" })],
    });
    expect(getTalentsSpent(char)).toBe(200);
  });

  it("falls back to a manually-entered cost when no real cost applies", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      talents: [
        talentEntry({ uid: "c1", talentId: "chem-geld", name: "Chem Geld", manualCost: 250 }),
      ],
    });
    expect(getTalentsSpent(char)).toBe(250);
  });

  it("prefers the real cost over a stored manual one when both exist", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      talents: [talentEntry({ uid: "s1", manualCost: 9999 })],
    });
    expect(getTalentsSpent(char)).toBe(100);
  });

  it("prefers the immutable paid cost over recalculating from the current career table", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      talents: [
        talentEntry({
          uid: "s1",
          xpPurchase: { cost: 175, careerId: "guardsman", sourceRankId: "conscript" },
        }),
      ],
    });
    expect(getTalentsSpent(char)).toBe(175);
  });

  it("charges nothing for an entry granted by another talent purchase", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      talents: [
        talentEntry({
          uid: "g1",
          talentId: "chem-geld",
          name: "Chem Geld",
          grantedByTalentEntryUid: "other-uid",
        }),
      ],
    });
    expect(getTalentsSpent(char)).toBe(0);
  });

  // Real Adept data: Unnatural Characteristic (Intelligence), 500 XP at Sage Logister.
  it("charges real Trait costs the same way as Talents", () => {
    const char = makeCharacter({
      career: "Adept",
      rank: "Sage Logister",
      traits: [
        {
          uid: "u1",
          talentId: "unnatural-characteristic",
          name: "Unnatural Characteristic (Intelligence)",
          specialisation: "Intelligence",
        },
      ],
    });
    expect(getTalentsSpent(char)).toBe(500);
  });

  it("sums Talents and Traits together in one total", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      talents: [talentEntry({ uid: "s1" })],
      traits: [{ uid: "u1", talentId: "chem-geld", name: "Off Career", manualCost: 50 }],
    });
    expect(getTalentsSpent(char)).toBe(150);
  });
});
