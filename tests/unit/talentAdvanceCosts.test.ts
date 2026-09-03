import { describe, it, expect } from "vitest";
import {
  getNextTalentCost,
  getTalentRankChips,
  hasAnyUnlockedTalentOption,
  isTalentMaxedAtCurrentRank,
} from "../../src/mechanics/experience/talentAdvanceCosts";
import type { TalentEntry } from "../../src/types/Character";

function entry(talentId: string, specialisation?: string): TalentEntry {
  return { uid: crypto.randomUUID(), talentId, name: talentId, specialisation };
}

describe("getNextTalentCost", () => {
  it("returns the real cost for an unlocked, unowned talent", () => {
    expect(getNextTalentCost("Guardsman", "Conscript", "sound-constitution", undefined, [])).toBe(100);
  });

  it("returns undefined once every currently-unlocked slot at this rank is owned", () => {
    const owned = [entry("sound-constitution"), entry("sound-constitution"), entry("sound-constitution")];
    expect(getNextTalentCost("Guardsman", "Conscript", "sound-constitution", undefined, owned)).toBeUndefined();
  });

  it("buys cheapest-unlocked-slot-first across multiple ranks", () => {
    // At Veteran: 3(Conscript)+1(Guard)+1(Armsman)+1(Sergeant) = 6 slots @100, +2(Veteran) @200 = 8 total
    const ownedFive = Array.from({ length: 5 }, () => entry("sound-constitution"));
    expect(getNextTalentCost("Guardsman", "Veteran", "sound-constitution", undefined, ownedFive)).toBe(100);
    const ownedSix = Array.from({ length: 6 }, () => entry("sound-constitution"));
    expect(getNextTalentCost("Guardsman", "Veteran", "sound-constitution", undefined, ownedSix)).toBe(200);
  });

  it("returns undefined for a talent never on the career's table at all", () => {
    expect(getNextTalentCost("Guardsman", "Veteran", "psy-rating-1", undefined, [])).toBeUndefined();
  });

  it("returns undefined for a talent on the career's table but at a rank not yet reached", () => {
    expect(getNextTalentCost("Guardsman", "Conscript", "hatred", "Xeno", [])).toBeUndefined();
  });
});

describe("getNextTalentCost, trait entries", () => {
  it("resolves a real trait cost too, not just talent entries", () => {
    expect(getNextTalentCost("Adept", "Sage Logister", "unnatural-characteristic", "Intelligence", [])).toBe(500);
  });
});

describe("isTalentMaxedAtCurrentRank", () => {
  it("is false for a talent not on the career's table at all", () => {
    expect(isTalentMaxedAtCurrentRank("Guardsman", "Conscript", "psy-rating-1", undefined, [])).toBe(false);
  });

  it("is false while unlocked slots remain unbought", () => {
    expect(isTalentMaxedAtCurrentRank("Guardsman", "Conscript", "sound-constitution", undefined, [])).toBe(false);
  });

  it("is true once every currently-unlocked slot is owned", () => {
    const owned = [entry("sound-constitution"), entry("sound-constitution"), entry("sound-constitution")];
    expect(isTalentMaxedAtCurrentRank("Guardsman", "Conscript", "sound-constitution", undefined, owned)).toBe(true);
  });
});

describe("getTalentRankChips", () => {
  it("lists every rank a repeatable talent appears at, regardless of the character's current rank", () => {
    const chips = getTalentRankChips("Guardsman", "sound-constitution", undefined);
    expect(chips).toEqual(["Conscript", "Guard", "Armsman", "Sergeant", "Veteran", "Assault Veteran", "Lieutenant", "Scout", "Shock Trooper", "Captain", "Marksman", "Storm Trooper", "Commander", "Sniper"]);
  });

  it("still lists a rank the character hasn't reached yet", () => {
    expect(getTalentRankChips("Guardsman", "hatred", "Xeno")).toEqual(["Veteran"]);
  });

  it("returns empty for a talent never on the career's table", () => {
    expect(getTalentRankChips("Guardsman", "psy-rating-1", undefined)).toEqual([]);
  });
});

describe("hasAnyUnlockedTalentOption", () => {
  it("is true when at least one specialisation still has an unlocked, unbought slot", () => {
    expect(hasAnyUnlockedTalentOption("Arbitrator", "Enforcer", "resistance", [])).toBe(true);
  });

  it("is false once every unlocked specialisation slot is owned", () => {
    const owned = [entry("resistance", "Cold"), entry("resistance", "Heat")];
    expect(hasAnyUnlockedTalentOption("Arbitrator", "Enforcer", "resistance", owned)).toBe(false);
  });

  it("is false for a talent never on the career's table", () => {
    expect(hasAnyUnlockedTalentOption("Guardsman", "Conscript", "psy-rating-1", [])).toBe(false);
  });
});
