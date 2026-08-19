import { describe, it, expect } from "vitest";
import { getAllCareerAdvances, getUnlockedCareerAdvances } from "../../src/features/experience/careerAdvanceAccess";

describe("getAllCareerAdvances", () => {
  it("returns every rank's advances for Guardsman, including ranks far beyond any starting point", () => {
    const all = getAllCareerAdvances("Guardsman");
    const rankIds = new Set(all.map((entry) => entry.rankId));
    expect(rankIds.has("conscript")).toBe(true);
    expect(rankIds.has("sniper")).toBe(true);
    expect(rankIds.has("commander")).toBe(true);
  });

  it("returns an empty array for a career with no data", () => {
    expect(getAllCareerAdvances("Made-Up Career")).toEqual([]);
  });

  it("returns an empty array when no career is given", () => {
    expect(getAllCareerAdvances(undefined)).toEqual([]);
  });
});

describe("getUnlockedCareerAdvances", () => {
  it("only includes ranks at or below the character's current rank", () => {
    const unlocked = getUnlockedCareerAdvances("Guardsman", "Sergeant");
    const rankIds = new Set(unlocked.map((entry) => entry.rankId));
    expect(rankIds).toEqual(new Set(["conscript", "guard", "armsman", "sergeant"]));
  });

  it("follows the character's actual branch once the career splits, excluding the other two paths", () => {
    const unlocked = getUnlockedCareerAdvances("Guardsman", "Captain");
    const rankIds = new Set(unlocked.map((entry) => entry.rankId));
    // Lieutenant's own path, all the way up to Captain.
    expect(rankIds.has("lieutenant")).toBe(true);
    expect(rankIds.has("captain")).toBe(true);
    // The other two branches at the same or later tiers must not appear.
    expect(rankIds.has("assault-veteran")).toBe(false);
    expect(rankIds.has("scout")).toBe(false);
    expect(rankIds.has("shock-trooper")).toBe(false);
    expect(rankIds.has("marksman")).toBe(false);
    // Not-yet-reached ranks on the same path don't appear either.
    expect(rankIds.has("commander")).toBe(false);
  });

  it("returns an empty array for an unrecognised rank name", () => {
    expect(getUnlockedCareerAdvances("Guardsman", "Not A Real Rank")).toEqual([]);
  });

  it("returns an empty array when no rank is given", () => {
    expect(getUnlockedCareerAdvances("Guardsman", undefined)).toEqual([]);
  });
});
