import { describe, it, expect } from "vitest";
import {
  careerNeedsStartingChoice,
  getDerivedCareerSkillIds,
  getDerivedCareerTalentGrants,
} from "../../src/features/career/careerStartingBenefits";

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
