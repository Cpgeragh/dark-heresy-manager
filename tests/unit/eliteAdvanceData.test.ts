import { describe, expect, it } from "vitest";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { ELITE_ADVANCES, TALENT_LIST } from "shared-rules";
import { TRAIT_LIST } from "../../src/data/reference/traitData";

const skillIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));
const talentIds = new Set(TALENT_LIST.map((talent) => talent.id));
const traitIds = new Set(TRAIT_LIST.map((trait) => trait.id));

describe("eliteAdvanceData", () => {
  const encarta = ELITE_ADVANCES.find((advance) => advance.id === "encarta-maleficarum");
  const nascent = ELITE_ADVANCES.find((advance) => advance.id === "nascent-psyker");
  const bloodswornCharter = ELITE_ADVANCES.find((advance) => advance.id === "bloodsworn-charter");
  const redRedemption = ELITE_ADVANCES.find(
    (advance) => advance.id === "cult-of-the-red-redemption"
  );

  it("stores Encarta Maleficarum independently from its alternate rank", () => {
    expect(encarta).toMatchObject({
      name: "Encarta Maleficarum",
      source: "IH",
      cost: 500,
      prerequisites: "T 40",
      downtime: "1d5 weeks",
      alternateRankIds: ["black-priest-of-maccabeus"],
      grantedTalents: ["insanely-faithful"],
    });
    expect(encarta?.consequences).toHaveLength(3);
    expect(encarta?.effects).toHaveLength(2);
  });

  it("stores the Bloodsworn Charter as the granted Malfian Bloodsworn Elite Advance", () => {
    expect(bloodswornCharter).toMatchObject({
      name: "Bloodsworn Charter",
      source: "IH",
      cost: 0,
      alternateRankIds: ["malfian-bloodsworn"],
      automaticGrantOnly: true,
    });
    expect(bloodswornCharter?.effects).toHaveLength(1);
  });

  it("records Nascent Psyker's Trait, permanent power selection, and Skill table", () => {
    expect(nascent).toMatchObject({
      name: "Nascent Psyker",
      source: "IH",
      cost: 0,
      grantedTraits: ["nascent-power"],
      grantedMinorPsychicPowers: 1,
      unlockedAdvances: [
        { kind: "skill", skillId: "deceive", level: "trained", cost: 100 },
        { kind: "skill", skillId: "psyniscience", level: "trained", cost: 100 },
      ],
    });
    expect(nascent?.effects).toHaveLength(2);
  });

  it("records the Cult of the Red Redemption package and its complete advancement table", () => {
    expect(redRedemption).toMatchObject({
      name: "The Cult of the Red Redemption",
      source: "IH",
      cost: 150,
      grantedSkills: [{ skillId: "secret-tongue-redemption", level: "trained" }],
      grantedTalents: ["flagellant", "frenzy"],
      grantedTraits: ["true-believer"],
    });
    expect(redRedemption?.unlockedAdvances).toHaveLength(13);
    expect(redRedemption?.unlockedAdvances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          talentId: "basic-weapon-training",
          specialisation: "Flame",
          cost: 200,
        }),
        expect.objectContaining({ talentId: "battle-rage", cost: 300 }),
      ])
    );
  });

  it("only grants skills and talents that exist", () => {
    for (const advance of ELITE_ADVANCES) {
      for (const grant of advance.grantedSkills ?? []) {
        expect(skillIds.has(grant.skillId), `${advance.id}: ${grant.skillId}`).toBe(true);
      }
      for (const talentId of advance.grantedTalents ?? []) {
        expect(talentIds.has(talentId), `${advance.id}: ${talentId}`).toBe(true);
      }
      for (const traitId of advance.grantedTraits ?? []) {
        expect(traitIds.has(traitId), `${advance.id}: ${traitId}`).toBe(true);
      }
      for (const unlocked of advance.unlockedAdvances ?? []) {
        if (unlocked.skillId) {
          expect(skillIds.has(unlocked.skillId), `${advance.id}: ${unlocked.skillId}`).toBe(true);
        }
        if (unlocked.talentId) {
          expect(talentIds.has(unlocked.talentId), `${advance.id}: ${unlocked.talentId}`).toBe(
            true
          );
        }
      }
    }
  });
});
