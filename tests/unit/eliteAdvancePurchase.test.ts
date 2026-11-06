import { describe, expect, it } from "vitest";
import {
  buildFixedTalentPurchase,
  buildSkillPurchase,
  nextSkillLevel,
  optionPurchase,
} from "../../src/mechanics/eliteAdvances/eliteAdvancePurchase";
import type {
  MissedRankSkillOption,
  MissedRankTalentOption,
} from "../../src/mechanics/eliteAdvances/eliteAdvanceAccess";
import type { EliteAdvancePurchase, SkillEntry } from "../../src/types/Character";
import { getSkillDefinition } from "../../src/utils/skillUtils";

const packageOption: MissedRankSkillOption = {
  key: "cult:skill:1",
  skillId: "secret-tongue-redemption",
  level: "+10",
  cost: 100,
  eliteAdvanceId: "cult-of-the-red-redemption",
  eliteAdvanceName: "The Cult of the Red Redemption",
};

describe("nextSkillLevel", () => {
  it("steps up one tier at a time and stops at +20", () => {
    expect(nextSkillLevel("untrained")).toBe("trained");
    expect(nextSkillLevel("trained")).toBe("+10");
    expect(nextSkillLevel("+10")).toBe("+20");
    expect(nextSkillLevel("+20")).toBeUndefined();
  });
});

describe("optionPurchase", () => {
  it("records a package option as bought through that package", () => {
    expect(optionPurchase(packageOption, "Cleric")).toEqual({
      source: "elite-package",
      cost: 100,
      sourceName: "The Cult of the Red Redemption",
      eliteAdvanceId: "cult-of-the-red-redemption",
    });
  });

  it("records a missed-rank option with the rank it replaced", () => {
    const option: MissedRankSkillOption = {
      key: "bp:preacher:skill:2",
      skillId: "carouse",
      level: "trained",
      cost: 150,
      alternateRankId: "black-priest-of-maccabeus",
      replacedRankId: "preacher",
    };

    expect(optionPurchase(option, "Cleric")).toEqual({
      source: "missed-rank",
      cost: 150,
      sourceName: "Missed Preacher Rank",
      alternateRankId: "black-priest-of-maccabeus",
      replacedRankId: "preacher",
    });
  });
});

describe("buildSkillPurchase", () => {
  const base = { career: "Cleric", rank: "Cleric" };

  it("adds a skill that is not owned yet at the bought tier", () => {
    const skills = buildSkillPurchase({
      ...base,
      skills: [],
      skillId: "secret-tongue-redemption",
      level: "+10",
      cost: 100,
      purchase: optionPurchase(packageOption, "Cleric"),
    });

    expect(skills).toEqual([
      expect.objectContaining({
        id: "secret-tongue-redemption",
        level: "+10",
        xpPurchases: { "+10": expect.objectContaining({ cost: 100 }) },
        eliteAdvancePurchases: { "+10": expect.objectContaining({ source: "elite-package" }) },
      }),
    ]);
    expect(skills?.[0].manualCosts).toBeUndefined();
  });

  it("keeps the purchases of the lower tiers and records a typed cost as a manual cost", () => {
    const owned: SkillEntry = {
      ...getSkillDefinition("acrobatics")!,
      level: "trained",
      xpPurchases: { trained: { cost: 100 } as never },
    };
    const gm: EliteAdvancePurchase = {
      source: "gm-approved",
      cost: 250,
      sourceName: "GM-approved Skill",
    };

    const skills = buildSkillPurchase({
      ...base,
      skills: [owned],
      skillId: "acrobatics",
      level: "+10",
      cost: 250,
      purchase: gm,
    });

    expect(skills).toHaveLength(1);
    expect(skills?.[0]).toMatchObject({
      level: "+10",
      manualCosts: { "+10": 250 },
      eliteAdvancePurchases: { "+10": gm },
      xpPurchases: { trained: { cost: 100 }, "+10": expect.objectContaining({ cost: 250 }) },
    });
  });

  it("returns nothing for a skill that does not exist", () => {
    expect(
      buildSkillPurchase({
        ...base,
        skills: [],
        skillId: "no-such-skill",
        level: "trained",
        cost: 0,
        purchase: { source: "gm-approved", cost: 0, sourceName: "GM-approved Skill" },
      })
    ).toBeUndefined();
  });
});

describe("buildFixedTalentPurchase", () => {
  const empty = { trained: [], exoticWeapons: [] };

  it("records a weapon training option as trained, with its paid cost and package", () => {
    const option: MissedRankTalentOption = {
      key: "cult:talent:2",
      talentId: "basic-weapon-training",
      specialisation: "Flame",
      cost: 200,
      eliteAdvanceId: "cult-of-the-red-redemption",
      eliteAdvanceName: "The Cult of the Red Redemption",
      weaponTrainingId: "basic-flame",
    };

    const result = buildFixedTalentPurchase({
      option,
      weaponTraining: empty,
      career: "Adept",
      rank: "Scribe",
    });

    expect(result).toMatchObject({
      kind: "training",
      weaponTraining: {
        trained: ["basic-flame"],
        xpPurchases: { "basic-flame": { cost: 200 } },
        eliteAdvancePurchases: { "basic-flame": { source: "elite-package", cost: 200 } },
      },
    });
  });

  it("builds a Talent entry with its paid cost and where it came from", () => {
    const option: MissedRankTalentOption = {
      key: "cult:talent:1",
      talentId: "hatred",
      specialisation: "Heretics",
      cost: 100,
      eliteAdvanceId: "cult-of-the-red-redemption",
      eliteAdvanceName: "The Cult of the Red Redemption",
    };

    const result = buildFixedTalentPurchase({
      option,
      weaponTraining: empty,
      career: "Adept",
      rank: "Scribe",
    });

    expect(result?.kind).toBe("talent");
    if (result?.kind !== "talent") return;
    expect(result.entry).toMatchObject({
      talentId: "hatred",
      xpPurchase: { cost: 100 },
      eliteAdvancePurchase: { source: "elite-package", cost: 100 },
    });
  });

  it("returns nothing for a talent that does not exist", () => {
    expect(
      buildFixedTalentPurchase({
        option: { key: "x", talentId: "no-such-talent", cost: 100 },
        weaponTraining: empty,
        career: "Adept",
        rank: "Scribe",
      })
    ).toBeUndefined();
  });
});
