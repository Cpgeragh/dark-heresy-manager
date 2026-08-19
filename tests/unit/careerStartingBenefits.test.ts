import { describe, it, expect } from "vitest";
import {
  applyTechPriestImplants,
  careerNeedsStartingChoice,
  getDerivedCareerSkillIds,
  getDerivedCareerTalentGrants,
  TECH_PRIEST_MECHANICUS_IMPLANT_GRANT_UID,
} from "../../src/features/career/careerStartingBenefits";
import type { CyberneticItem } from "../../src/types/Character";

describe("getDerivedCareerSkillIds", () => {
  it("returns an empty array for a career with no data", () => {
    expect(getDerivedCareerSkillIds("Arbitrator", undefined)).toEqual([]);
  });

  it("returns an empty array when no career is given", () => {
    expect(getDerivedCareerSkillIds(undefined, undefined)).toEqual([]);
  });

  it("resolves fixed grants without needing a choice", () => {
    const ids = getDerivedCareerSkillIds("Guardsman", undefined);
    expect(ids).toContain("speak-low-gothic");
  });

  it("leaves an unresolved 'or' choice out until a pick is captured", () => {
    const ids = getDerivedCareerSkillIds("Guardsman", undefined);
    expect(ids).not.toContain("drive-ground");
    expect(ids).not.toContain("swim");
  });

  it("resolves an 'or' choice once captured", () => {
    const ids = getDerivedCareerSkillIds("Guardsman", { skillChoices: { 1: 1 } });
    expect(ids).toContain("swim");
    expect(ids).not.toContain("drive-ground");
  });
});

describe("getDerivedCareerTalentGrants", () => {
  it("resolves fixed grants without needing a choice", () => {
    const grants = getDerivedCareerTalentGrants("Guardsman", undefined);
    expect(grants).toContainEqual({ talentId: "melee-weapon-training", specialisation: "Primitive", grantIndex: 0 });
  });

  it("leaves an unresolved 'or' choice out until a pick is captured", () => {
    const grants = getDerivedCareerTalentGrants("Guardsman", undefined);
    expect(grants.some((grant) => grant.grantIndex === 1)).toBe(false);
  });

  it("resolves an 'or' choice once captured", () => {
    const grants = getDerivedCareerTalentGrants("Guardsman", { talentChoices: { 1: 1 } });
    expect(grants).toContainEqual({ talentId: "pistol-training", specialisation: "Las", grantIndex: 1 });
  });
});

describe("applyTechPriestImplants", () => {
  it("grants all six implants when the career is Tech-Priest, with real availability but no cost or craftsmanship", () => {
    const granted = applyTechPriestImplants([], "Tech-Priest");
    expect(granted).toHaveLength(6);
    for (const item of granted) {
      expect(item.craftsmanship).toBeUndefined();
      expect(item.value).toBeUndefined();
      expect(item.availability).toBe("Adeptus Mechanicus Only");
      expect(item.grantedByTalentEntryUid).toBe(TECH_PRIEST_MECHANICUS_IMPLANT_GRANT_UID);
    }
  });

  it("grants nothing for a different career", () => {
    expect(applyTechPriestImplants([], "Guardsman")).toEqual([]);
  });

  it("removes the granted implants when the career changes away from Tech-Priest", () => {
    const granted = applyTechPriestImplants([], "Tech-Priest");
    expect(applyTechPriestImplants(granted, "Guardsman")).toEqual([]);
  });

  it("leaves manually-added cybernetics untouched", () => {
    const manual: CyberneticItem = {
      id: "manual-1",
      name: "Bionic Arm",
      craftsmanship: "Common",
    };
    const result = applyTechPriestImplants([manual], "Tech-Priest");
    expect(result).toContainEqual(manual);
    expect(result).toHaveLength(7);
  });

  it("does not duplicate the granted implants if applied again", () => {
    const once = applyTechPriestImplants([], "Tech-Priest");
    const twice = applyTechPriestImplants(once, "Tech-Priest");
    expect(twice).toHaveLength(6);
  });
});

describe("careerNeedsStartingChoice", () => {
  it("is true for a career with at least one 'or' choice", () => {
    expect(careerNeedsStartingChoice("Guardsman")).toBe(true);
    expect(careerNeedsStartingChoice("Adept")).toBe(true);
  });

  it("is false for a career with no starting-benefit data yet", () => {
    expect(careerNeedsStartingChoice("Arbitrator")).toBe(false);
  });

  it("is false when no career is given", () => {
    expect(careerNeedsStartingChoice(undefined)).toBe(false);
  });
});
