import { describe, it, expect } from "vitest";
import {
  getAllCareerAdvances,
  getUnlockedCareerAdvances,
} from "../../src/mechanics/experience/careerAdvanceAccess";

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

  it("unlocks Scholar Materium on only the Imperial Psyker scholar branch", () => {
    const atScholarMaterium = new Set(
      getUnlockedCareerAdvances("Imperial Psyker", "Scholar Materium").map((entry) => entry.rankId)
    );
    expect(atScholarMaterium).toEqual(
      new Set(["sanctionite", "neonate", "aspirant", "scholar-materium"])
    );

    const atScholarMedicae = new Set(
      getUnlockedCareerAdvances("Imperial Psyker", "Scholar Medicae").map((entry) => entry.rankId)
    );
    expect(atScholarMedicae).toEqual(
      new Set(["sanctionite", "neonate", "aspirant", "scholar-materium", "scholar-medicae"])
    );

    const atSavantWarrant = new Set(
      getUnlockedCareerAdvances("Imperial Psyker", "Savant Warrant").map((entry) => entry.rankId)
    );
    expect(atSavantWarrant.has("scholar-materium")).toBe(false);
  });

  it("returns an empty array for an unrecognised rank name", () => {
    expect(getUnlockedCareerAdvances("Guardsman", "Not A Real Rank")).toEqual([]);
  });

  it("returns an empty array when no rank is given", () => {
    expect(getUnlockedCareerAdvances("Guardsman", undefined)).toEqual([]);
  });

  it("replaces the normal Rank table with the selected Alternate Rank table", () => {
    const unlocked = getUnlockedCareerAdvances("Cleric", "Preacher", [
      {
        alternateRankId: "black-priest-of-maccabeus",
        replacedRankId: "preacher",
        takenAtTier: 4,
      },
    ]);
    const replacedRankEntries = unlocked.filter((entry) => entry.rankId === "preacher");

    expect(replacedRankEntries).not.toHaveLength(0);
    expect(
      replacedRankEntries.every((entry) => entry.alternateRankId === "black-priest-of-maccabeus")
    ).toBe(true);
    expect(
      replacedRankEntries.some(
        (entry) =>
          entry.advance.kind === "skill" && entry.advance.skillId === "forbidden-daemonology"
      )
    ).toBe(true);
    expect(
      replacedRankEntries.some(
        (entry) =>
          entry.advance.kind === "skill" &&
          entry.advance.skillId === "barter" &&
          entry.advance.level === "+10"
      )
    ).toBe(false);
  });

  it("uses Bonded Emissary as an Adept or Tech-Priest replacement", () => {
    const adept = getUnlockedCareerAdvances("Adept", "Inditor", [
      {
        alternateRankId: "bonded-emissary",
        replacedRankId: "inditor",
        takenAtTier: 4,
      },
    ]);
    const techPriest = getUnlockedCareerAdvances("Tech-Priest", "Enginseer", [
      {
        alternateRankId: "bonded-emissary",
        replacedRankId: "enginseer",
        takenAtTier: 4,
      },
    ]);

    for (const entries of [adept, techPriest]) {
      expect(
        entries.some(
          (entry) =>
            entry.alternateRankId === "bonded-emissary" &&
            entry.advance.kind === "skill" &&
            entry.advance.skillId === "scholastic-mercantile"
        )
      ).toBe(true);
    }
  });

  it("uses the Feral Warrior table and retains both Sound Constitution slots", () => {
    const unlocked = getUnlockedCareerAdvances("Guardsman", "Armsman", [
      {
        alternateRankId: "feral-warrior",
        replacedRankId: "armsman",
        takenAtTier: 3,
      },
    ]);
    const replacedRankEntries = unlocked.filter((entry) => entry.rankId === "armsman");

    expect(replacedRankEntries).toHaveLength(20);
    expect(replacedRankEntries.every((entry) => entry.alternateRankId === "feral-warrior")).toBe(
      true
    );
    expect(
      replacedRankEntries.filter(
        (entry) =>
          entry.advance.kind === "talent" && entry.advance.talentId === "sound-constitution"
      )
    ).toHaveLength(2);
  });
});
