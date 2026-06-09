import { describe, it, expect, vi } from "vitest";
import type { SkillEntry } from "../../src/types/Character";
import { SkillSource } from "../../src/types/SkillSource";

// vi.hoisted ensures these values are available inside the vi.mock factory,
// which is hoisted to the top of the file by Vitest before any imports run.
const { MOCK_DEFAULT_SKILLS } = vi.hoisted(() => {
  const skills: SkillEntry[] = [
    {
      id: "acrobatics",
      name: "Acrobatics",
      characteristic: "ag",
      level: "untrained",
      category: "Athletic",
      advanced: false,
      source: "CR" as SkillSource,
    },
    {
      id: "athletics",
      name: "Athletics",
      characteristic: "ag",
      level: "untrained",
      category: "Athletic",
      advanced: false,
      source: "CR" as SkillSource,
    },
    {
      id: "logic",
      name: "Logic",
      characteristic: "int",
      level: "untrained",
      category: "Academic",
      advanced: true,
      source: "CR" as SkillSource,
    },
  ];
  return { MOCK_DEFAULT_SKILLS: skills };
});

vi.mock("../../src/data/defaultSkills", () => ({
  DEFAULT_SKILLS: MOCK_DEFAULT_SKILLS,
}));

import { normaliseSkills, skillsNeedNormalisation } from "../../src/utils/skillUtils";

// ============================================================
// normaliseSkills
// ============================================================

describe("normaliseSkills", () => {
  it("returns DEFAULT_SKILLS when input is null", () => {
    expect(normaliseSkills(null)).toEqual(MOCK_DEFAULT_SKILLS);
  });

  it("returns DEFAULT_SKILLS when input is undefined", () => {
    expect(normaliseSkills(undefined)).toEqual(MOCK_DEFAULT_SKILLS);
  });

  it("returns DEFAULT_SKILLS when input is a plain object (not an array)", () => {
    expect(normaliseSkills({ id: "acrobatics" })).toEqual(MOCK_DEFAULT_SKILLS);
  });

  it("returns DEFAULT_SKILLS when input is an empty array (no saved data preserving)", () => {
    // No saved skills → all three from DEFAULT_SKILLS returned at their defaults
    const result = normaliseSkills([]);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("acrobatics");
  });

  it("preserves the saved level for a known skill", () => {
    const saved = [{ ...MOCK_DEFAULT_SKILLS[0], level: "+10" as const }];
    const result = normaliseSkills(saved);
    expect(result[0].level).toBe("+10");
  });

  it("preserves the saved miscModifier", () => {
    const saved = [{ ...MOCK_DEFAULT_SKILLS[1], miscModifier: 5 }];
    const result = normaliseSkills(saved);
    const athletics = result.find((s) => s.id === "athletics");
    expect(athletics?.miscModifier).toBe(5);
  });

  it("preserves the saved notes", () => {
    const saved = [{ ...MOCK_DEFAULT_SKILLS[0], notes: "Trained under Arbites" }];
    const result = normaliseSkills(saved);
    expect(result[0].notes).toBe("Trained under Arbites");
  });

  it("picks up new DEFAULT_SKILLS skills not present in the saved array", () => {
    // Only acrobatics was saved; result should still include all 3 from DEFAULT_SKILLS
    const saved = [{ ...MOCK_DEFAULT_SKILLS[0] }];
    const result = normaliseSkills(saved);
    expect(result).toHaveLength(3);
    expect(result.some((s) => s.id === "logic")).toBe(true);
  });

  it("drops obsolete saved skills whose ids are no longer in DEFAULT_SKILLS", () => {
    const saved = [
      { ...MOCK_DEFAULT_SKILLS[0] },
      {
        id: "obsolete-skill",
        name: "Old Skill",
        characteristic: "ag" as const,
        level: "trained" as const,
        category: "X",
        advanced: false,
        source: "CR" as SkillSource,
      },
    ];
    const result = normaliseSkills(saved);
    expect(result).toHaveLength(3);
    expect(result.every((s) => s.id !== "obsolete-skill")).toBe(true);
  });

  it("overrides stale metadata (name, characteristic) with the DEFAULT_SKILLS version", () => {
    // The saved copy has an outdated name and characteristic from a previous version
    const saved = [{ ...MOCK_DEFAULT_SKILLS[0], name: "Old Name", characteristic: "wp" as const }];
    const result = normaliseSkills(saved);
    expect(result[0].name).toBe("Acrobatics");
    expect(result[0].characteristic).toBe("ag");
  });

  it("returns skills in DEFAULT_SKILLS order regardless of saved order", () => {
    const savedReversed = [
      { ...MOCK_DEFAULT_SKILLS[2] }, // logic (originally third)
      { ...MOCK_DEFAULT_SKILLS[1] }, // athletics (originally second)
      { ...MOCK_DEFAULT_SKILLS[0] }, // acrobatics (originally first)
    ];
    const result = normaliseSkills(savedReversed);
    expect(result.map((s) => s.id)).toEqual(["acrobatics", "athletics", "logic"]);
  });

  it("falls back to DEFAULT_SKILLS level when saved level is undefined", () => {
    const saved = [{ ...MOCK_DEFAULT_SKILLS[0], level: undefined as unknown as "untrained" }];
    const result = normaliseSkills(saved);
    expect(result[0].level).toBe("untrained"); // DEFAULT_SKILLS default
  });
});

// ============================================================
// skillsNeedNormalisation
// ============================================================

describe("skillsNeedNormalisation", () => {
  it("returns true when input is not an array", () => {
    expect(skillsNeedNormalisation(null)).toBe(true);
    expect(skillsNeedNormalisation(undefined)).toBe(true);
    expect(skillsNeedNormalisation("string")).toBe(true);
    expect(skillsNeedNormalisation({})).toBe(true);
  });

  it("returns false when saved skills exactly match the normalised result", () => {
    // MOCK_DEFAULT_SKILLS is already normalised — no changes needed
    expect(skillsNeedNormalisation([...MOCK_DEFAULT_SKILLS])).toBe(false);
  });

  it("returns true when lengths differ (a new skill was added to DEFAULT_SKILLS)", () => {
    const onlyTwo = MOCK_DEFAULT_SKILLS.slice(0, 2);
    expect(skillsNeedNormalisation(onlyTwo)).toBe(true);
  });

  it("returns true when skill id order has changed", () => {
    const reordered = [
      MOCK_DEFAULT_SKILLS[1], // athletics first instead of acrobatics
      MOCK_DEFAULT_SKILLS[0],
      MOCK_DEFAULT_SKILLS[2],
    ];
    expect(skillsNeedNormalisation(reordered)).toBe(true);
  });

  it("returns true when a skill name differs from DEFAULT_SKILLS (stale cached name)", () => {
    const withStaleName = MOCK_DEFAULT_SKILLS.map((s, i) =>
      i === 0 ? { ...s, name: "Old Acrobatics" } : s
    );
    expect(skillsNeedNormalisation(withStaleName)).toBe(true);
  });

  it("returns true when a skill characteristic differs from DEFAULT_SKILLS", () => {
    const withStaleChar = MOCK_DEFAULT_SKILLS.map((s, i) =>
      i === 1 ? { ...s, characteristic: "wp" as const } : s
    );
    expect(skillsNeedNormalisation(withStaleChar)).toBe(true);
  });

  it("returns true when a skill category differs from DEFAULT_SKILLS", () => {
    const withStaleCategory = MOCK_DEFAULT_SKILLS.map((s, i) =>
      i === 2 ? { ...s, category: "OldCategory" } : s
    );
    expect(skillsNeedNormalisation(withStaleCategory)).toBe(true);
  });

  it("returns true when a skill advanced flag differs from DEFAULT_SKILLS", () => {
    const withFlippedAdvanced = MOCK_DEFAULT_SKILLS.map((s, i) =>
      i === 2 ? { ...s, advanced: !s.advanced } : s
    );
    expect(skillsNeedNormalisation(withFlippedAdvanced)).toBe(true);
  });

  it("returns true when a skill source differs from DEFAULT_SKILLS", () => {
    const withStaleSource = MOCK_DEFAULT_SKILLS.map((s, i) =>
      i === 0 ? { ...s, source: "IH" as SkillSource } : s
    );
    expect(skillsNeedNormalisation(withStaleSource)).toBe(true);
  });

  it("returns true when a skill level is undefined (needs normalisation to set default)", () => {
    const withUndefinedLevel = MOCK_DEFAULT_SKILLS.map((s, i) =>
      i === 0 ? { ...s, level: undefined as unknown as "untrained" } : s
    );
    // normalised sets level to "untrained", but saved has undefined → mismatch
    expect(skillsNeedNormalisation(withUndefinedLevel)).toBe(true);
  });
});
