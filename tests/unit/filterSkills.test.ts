// tests/unit/filterSkills.test.ts
//
// Tests the pure filterSkills() utility from src/utils/skillFilters.ts.
// Note: this is different from tests/unit/skillFilters.test.ts, which tests
// the useSkillFiltering React hook. This file covers the raw filter function.

import { describe, it, expect } from "vitest";
import { filterSkills } from "../../src/utils/skillFilters";
import { SkillSource } from "../../src/types/SkillSource";
import type { SkillEntry } from "../../src/types/Character";

const makeSkill = (overrides: Partial<SkillEntry>): SkillEntry => ({
  id: "test-skill",
  name: "Test Skill",
  characteristic: "ag",
  level: "untrained",
  category: "General",
  advanced: false,
  source: SkillSource.CR,
  ...overrides,
});

const skills: SkillEntry[] = [
  makeSkill({ id: "a", category: "Athletic", source: SkillSource.CR, characteristic: "ag", advanced: false }),
  makeSkill({ id: "b", category: "Academic", source: SkillSource.IH, characteristic: "int", advanced: true }),
  makeSkill({ id: "c", category: "Athletic", source: SkillSource.CR, characteristic: "ag", advanced: false }),
  makeSkill({ id: "d", category: "Combat", source: SkillSource.BoM, characteristic: "wp", advanced: true }),
];

describe("filterSkills", () => {
  it("returns all skills when no filter options are provided", () => {
    expect(filterSkills(skills, {})).toHaveLength(4);
  });

  describe("category filter", () => {
    it("returns only skills matching the given category", () => {
      const result = filterSkills(skills, { category: "Athletic" });
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.category === "Athletic")).toBe(true);
    });

    it("returns empty array when no skill matches the category", () => {
      expect(filterSkills(skills, { category: "Nonexistent" })).toHaveLength(0);
    });
  });

  describe("source filter", () => {
    it("returns only skills from the given source book", () => {
      const result = filterSkills(skills, { source: SkillSource.CR });
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.source === SkillSource.CR)).toBe(true);
    });

    it("returns empty array when no skill matches the source", () => {
      expect(filterSkills(skills, { source: SkillSource.RH })).toHaveLength(0);
    });
  });

  describe("characteristic filter", () => {
    it("returns only skills linked to the given characteristic", () => {
      const result = filterSkills(skills, { characteristic: "int" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("b");
    });

    it("returns multiple skills that share a characteristic", () => {
      const result = filterSkills(skills, { characteristic: "ag" });
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(["a", "c"]);
    });
  });

  describe("advanced filter", () => {
    it("returns only advanced skills when advanced=true", () => {
      const result = filterSkills(skills, { advanced: true });
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.advanced)).toBe(true);
    });

    it("returns only basic skills when advanced=false", () => {
      const result = filterSkills(skills, { advanced: false });
      expect(result).toHaveLength(2);
      expect(result.every((s) => !s.advanced)).toBe(true);
    });
  });

  describe("combined filters", () => {
    it("applies category and source together", () => {
      const result = filterSkills(skills, { category: "Athletic", source: SkillSource.CR });
      expect(result).toHaveLength(2);
    });

    it("returns empty array when combined filters match nothing", () => {
      // No Athletic skill from BoM
      expect(filterSkills(skills, { category: "Athletic", source: SkillSource.BoM })).toHaveLength(0);
    });

    it("applies all four filters simultaneously", () => {
      // Skills "a" and "c" both match: Athletic + CR + ag + not advanced
      const result = filterSkills(skills, {
        category: "Athletic",
        source: SkillSource.CR,
        characteristic: "ag",
        advanced: false,
      });
      expect(result).toHaveLength(2);
    });

    it("returns empty array when skills list is empty", () => {
      expect(filterSkills([], { category: "Athletic" })).toHaveLength(0);
    });
  });
});
