import { describe, expect, it } from "vitest";
import {
  getAvailableNamedEliteAdvances,
  getMissedRankEliteAdvanceOptions,
  getPackageEliteAdvanceOptions,
} from "../../src/mechanics/eliteAdvances/eliteAdvanceAccess";
import type { ExperienceBlock, TalentsAndTraitsBlock } from "../../src/types/Character";
import { getSkillDefinition } from "../../src/utils/skillUtils";

const NO_TALENTS: TalentsAndTraitsBlock = { homeworld: "", talents: [], traits: [] };
const NO_TRAINING = { trained: [], exoticWeapons: [] };

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
      }).map((entry) => entry.id)
    ).toEqual(["nascent-psyker", "cult-of-the-red-redemption"]);
  });

  it("does not expose missed-rank advances until the following rank", () => {
    const result = getMissedRankEliteAdvanceOptions({
      career: "Cleric",
      rank: "Preacher",
      experience,
      skills: [],
      talents: NO_TALENTS,
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
      talents: NO_TALENTS,
    });
    expect(result.skills).toContainEqual(
      expect.objectContaining({ skillId: "carouse", level: "trained", cost: 150 })
    );
    expect(result.skills).not.toContainEqual(expect.objectContaining({ skillId: "command" }));
    expect(result.talents).toContainEqual(
      expect.objectContaining({ talentId: "talented", specialisation: "Gamble", cost: 250 })
    );
    expect(result.talents).not.toContainEqual(
      expect.objectContaining({ talentId: "pistol-training", specialisation: "Bolt" })
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

  it("offers a missed-rank +10 only once the skill is Trained", () => {
    const base = {
      career: "Cleric",
      rank: "Cleric",
      experience,
      talents: NO_TALENTS,
    };
    expect(
      getMissedRankEliteAdvanceOptions({ ...base, skills: [] }).skills.some(
        (option) => option.skillId === "barter" && option.level === "+10"
      )
    ).toBe(false);
    expect(
      getMissedRankEliteAdvanceOptions({
        ...base,
        skills: [{ ...getSkillDefinition("barter")!, level: "trained" }],
      }).skills
    ).toContainEqual(expect.objectContaining({ skillId: "barter", level: "+10", cost: 150 }));
  });

  it("hides a package skill advance the career sells at the same tier right now", () => {
    const talents: TalentsAndTraitsBlock = {
      ...NO_TALENTS,
      eliteAdvances: [{ uid: "nascent", eliteAdvanceId: "nascent-psyker", name: "Nascent Psyker" }],
    };
    const options = (rank: string) =>
      getPackageEliteAdvanceOptions({
        talents,
        skills: [],
        weaponTraining: NO_TRAINING,
        career: "Cleric",
        rank,
      }).skills.map((option) => option.skillId);

    expect(options("Novice")).toEqual(["deceive", "psyniscience"]);
    expect(options("Initiate")).toEqual(["psyniscience"]);
  });

  it("hides package talent and weapon training advances the career sells right now", () => {
    const talents: TalentsAndTraitsBlock = {
      ...NO_TALENTS,
      eliteAdvances: [
        {
          uid: "redemption",
          eliteAdvanceId: "cult-of-the-red-redemption",
          name: "The Cult of the Red Redemption",
        },
      ],
    };
    const options = (rank: string) =>
      getPackageEliteAdvanceOptions({
        talents,
        skills: [],
        weaponTraining: NO_TRAINING,
        career: "Adepta Sororitas",
        rank,
      }).talents;

    expect(options("Novice")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ talentId: "hatred", specialisation: "Heretics" }),
        expect.objectContaining({ weaponTrainingId: "basic-flame" }),
      ])
    );
    expect(options("Militant")).not.toContainEqual(
      expect.objectContaining({ talentId: "hatred", specialisation: "Heretics" })
    );
    expect(options("Militant")).not.toContainEqual(
      expect.objectContaining({ weaponTrainingId: "basic-flame" })
    );
  });
});
