import { describe, expect, it } from "vitest";
import {
  getAvailableNamedEliteAdvances,
  getMissedRankEliteAdvanceOptions,
  getPackageEliteAdvanceOptions,
} from "../../src/mechanics/eliteAdvances/eliteAdvanceAccess";
import type { ExperienceBlock } from "../../src/types/Character";

const experience: ExperienceBlock = {
  total: 3_000,
  spent: 2_000,
  ranks: [],
  alternateRanks: [
    {
      alternateRankId: "black-priest-of-maccabeus",
      replacedRankId: "preacher",
      takenAtTier: 4,
    },
  ],
};

describe("Elite Advance access", () => {
  it("offers general packages immediately and unlocks restricted advances through their Alternate Rank", () => {
    expect(
      getAvailableNamedEliteAdvances({ total: 0, spent: 0, ranks: [] }).map((entry) => entry.id)
    ).toEqual(["nascent-psyker", "cult-of-the-red-redemption"]);
    expect(getAvailableNamedEliteAdvances(experience).map((entry) => entry.id)).toEqual([
      "encarta-maleficarum",
      "nascent-psyker",
      "cult-of-the-red-redemption",
    ]);
  });

  it("does not offer an automatic Alternate Rank grant as a purchase", () => {
    expect(
      getAvailableNamedEliteAdvances({
        total: 3_000,
        spent: 3_000,
        ranks: [],
        alternateRanks: [
          {
            alternateRankId: "malfian-bloodsworn",
            replacedRankId: "veteran",
            takenAtTier: 5,
          },
        ],
      })
      .map((entry) => entry.id)
    ).toEqual(["nascent-psyker", "cult-of-the-red-redemption"]);
  });

  it("does not expose missed-rank advances until the following rank", () => {
    const result = getMissedRankEliteAdvanceOptions({
      career: "Cleric",
      rank: "Preacher",
      experience,
      skills: [],
      talents: [],
    });
    expect(result.skills).toEqual([]);
    expect(result.talents).toEqual([]);
  });

  it("adds 50 XP to missed-rank advances after the following rank is reached", () => {
    const result = getMissedRankEliteAdvanceOptions({
      career: "Cleric",
      rank: "Cleric",
      experience,
      skills: [],
      talents: [],
    });
    expect(result.skills).toContainEqual(
      expect.objectContaining({ skillId: "command", level: "trained", cost: 150 })
    );
    expect(result.talents).toContainEqual(
      expect.objectContaining({ talentId: "pistol-training", specialisation: "Bolt", cost: 250 })
    );
  });

  it("unlocks the next Redemption skill tier and its cult Talent table", () => {
    const talents = {
      homeworld: "",
      talents: [],
      traits: [],
      eliteAdvances: [
        {
          uid: "redemption",
          eliteAdvanceId: "cult-of-the-red-redemption",
          name: "The Cult of the Red Redemption",
        },
      ],
    };
    const result = getPackageEliteAdvanceOptions({
      talents,
      skills: [],
      weaponTraining: { trained: [], exoticWeapons: [] },
    });

    expect(result.skills).toEqual([
      expect.objectContaining({
        skillId: "secret-tongue-redemption",
        level: "+10",
        cost: 100,
      }),
    ]);
    expect(result.talents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ talentId: "hatred", specialisation: "Heretics", cost: 100 }),
        expect.objectContaining({
          talentId: "basic-weapon-training",
          specialisation: "Flame",
          weaponTrainingId: "basic-flame",
          cost: 200,
        }),
        expect.objectContaining({ talentId: "battle-rage", cost: 300 }),
      ])
    );
  });

  it("unlocks the Nascent Psyker Skill table", () => {
    const talents = {
      homeworld: "",
      talents: [],
      traits: [],
      eliteAdvances: [
        {
          uid: "nascent",
          eliteAdvanceId: "nascent-psyker",
          name: "Nascent Psyker",
        },
      ],
    };
    const result = getPackageEliteAdvanceOptions({
      talents,
      skills: [],
      weaponTraining: { trained: [], exoticWeapons: [] },
    });

    expect(result.skills).toEqual([
      expect.objectContaining({ skillId: "deceive", level: "trained", cost: 100 }),
      expect.objectContaining({ skillId: "psyniscience", level: "trained", cost: 100 }),
    ]);
    expect(result.talents).toEqual([]);
  });
});
