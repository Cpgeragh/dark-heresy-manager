import { describe, expect, it } from "vitest";
import { CAREER_ADVANCES } from "../../src/data/reference/careerAdvancesReference";
import { CAREER_LIST } from "../../src/data/reference/careerData";
import { HOMEWORLD_LIST } from "../../src/data/reference/homeworldData";
import { getCareerRankProgression } from "../../src/mechanics/experience/careerRankProgression";

describe("Adepta Sororitas career", () => {
  const career = CAREER_LIST.find((entry) => entry.id === "adepta-sororitas");
  const advances = CAREER_ADVANCES.find((entry) => entry.careerId === "adepta-sororitas");

  it("records the supplied eligibility and starting package", () => {
    expect(career).toMatchObject({
      name: "Adepta Sororitas",
      startingRank: "Novice",
      startingWealth: "70+2d10 Thrones",
      monthlyIncome: "Supine Class",
      requirements: [
        "The GM’s permission is required.",
        "Sororitas characters are female without exception.",
        "The character cannot begin play with mutations or Corruption Points.",
        "The character must originate from a Feral World, Imperial World, the Schola Progenium, or a Noble Born origin.",
      ],
      startingSkillGrants: [
        { options: [{ skillId: "common-imperial-creed" }] },
        { options: [{ skillId: "literacy" }] },
        { options: [{ skillId: "performer-singer" }] },
        { options: [{ skillId: "speak-low-gothic" }] },
        { options: [{ skillId: "trade-copyist" }] },
      ],
      startingTalentGrants: [
        { options: [{ talentId: "basic-weapon-training", specialisation: "Primitive" }] },
        { options: [{ talentId: "melee-weapon-training", specialisation: "Primitive" }] },
        { options: [{ talentId: "pistol-training", specialisation: "Las" }] },
        { options: [{ talentId: "pure-faith" }] },
      ],
    });
  });

  it("is offered only for the four supplied origins", () => {
    expect(
      HOMEWORLD_LIST.filter((homeworld) =>
        homeworld.careers.some((entry) => (entry.careerName ?? entry.name) === "Adepta Sororitas")
      ).map((homeworld) => homeworld.id)
    ).toEqual(["feral-world", "imperial-world", "schola-progenium", "noble-born"]);
  });

  it("records the complete rank chart and paths", () => {
    expect(
      career?.ranks.map((rank) => [rank.id, rank.tier, ...(rank.paths ?? [])].join("|"))
    ).toEqual([
      "sororitas-novice|1",
      "sororitas-cantus|2",
      "sororitas-constantia|3",
      "sororitas-dialogous|4|Dialogous",
      "sororitas-hospitaller|4|Hospitaller",
      "sororitas-militant|4|Militant",
      "sororitas-famula|5|Dialogous",
      "sororitas-curia|5|Hospitaller",
      "sororitas-elohiem|5|Militant",
      "sororitas-nunciate|6|Dialogous",
      "sororitas-almoness|6|Hospitaller",
      "sororitas-celestian|6|Militant",
      "sororitas-superior|7|Dialogous|Hospitaller|Militant",
      "sororitas-legatine|8|Dialogous|Hospitaller|Militant",
    ]);
  });

  it("branches after Constantia and converges at Superior", () => {
    expect(
      getCareerRankProgression("Adepta Sororitas", "Constantia", 2_000)?.nextRanks.map(
        (rank) => rank.name
      )
    ).toEqual(["Dialogous", "Hospitaller", "Militant"]);
    expect(
      getCareerRankProgression("Adepta Sororitas", "Famula", 6_000, "Dialogous")?.nextRanks.map(
        (rank) => rank.name
      )
    ).toEqual(["Nunciate"]);
    expect(
      getCareerRankProgression("Adepta Sororitas", "Nunciate", 8_000, "Dialogous")?.nextRanks.map(
        (rank) => rank.name
      )
    ).toEqual(["Superior"]);
    expect(
      getCareerRankProgression(
        "Adepta Sororitas",
        "Superior",
        10_000,
        "Hospitaller"
      )?.nextRanks.map((rank) => rank.name)
    ).toEqual(["Legatine"]);
  });

  it("records all 275 supplied rank advances", () => {
    expect(advances?.rankTables.map((table) => [table.rankId, table.advances.length])).toEqual([
      ["sororitas-novice", 13],
      ["sororitas-cantus", 21],
      ["sororitas-constantia", 20],
      ["sororitas-dialogous", 28],
      ["sororitas-hospitaller", 13],
      ["sororitas-militant", 19],
      ["sororitas-famula", 21],
      ["sororitas-curia", 19],
      ["sororitas-elohiem", 22],
      ["sororitas-nunciate", 21],
      ["sororitas-almoness", 21],
      ["sororitas-celestian", 22],
      ["sororitas-superior", 19],
      ["sororitas-legatine", 16],
    ]);
    expect(advances?.rankTables.reduce((total, table) => total + table.advances.length, 0)).toBe(
      275
    );
  });

  it("records the supplied characteristic advance costs", () => {
    expect(advances?.characteristicAdvances).toEqual({
      ws: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      bs: { simple: 100, intermediate: 250, trained: 500, expert: 750 },
      s: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      t: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      ag: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      int: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
      per: { simple: 100, intermediate: 250, trained: 500, expert: 750 },
      wp: { simple: 100, intermediate: 250, trained: 500, expert: 750 },
      fel: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
    });
  });
});
