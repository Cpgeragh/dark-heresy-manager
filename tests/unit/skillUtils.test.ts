import { describe, expect, it, vi } from "vitest";
import type { SkillEntry } from "../../src/types/Character";
import { SkillSource } from "../../src/types/SkillSource";

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

import { buildSkillCatalogue, getSkillDefinition } from "../../src/utils/skillUtils";

describe("buildSkillCatalogue", () => {
  it("uses the external catalogue when the character owns no Skills", () => {
    expect(buildSkillCatalogue([])).toEqual(MOCK_DEFAULT_SKILLS);
  });

  it("overlays all character-owned progress without changing the saved array", () => {
    const owned: SkillEntry[] = [
      {
        ...MOCK_DEFAULT_SKILLS[0],
        level: "+10",
        notes: "Trained under Arbites",
        manualCosts: { trained: 75 },
        xpPurchases: {
          trained: { cost: 75, purchasedAtRankId: "recruit" },
          "+10": { cost: 100, purchasedAtRankId: "trooper" },
        },
      },
    ];

    const result = buildSkillCatalogue(owned);

    expect(result[0]).toMatchObject({
      level: "+10",
      notes: "Trained under Arbites",
      manualCosts: { trained: 75 },
      xpPurchases: {
        trained: { cost: 75, purchasedAtRankId: "recruit" },
        "+10": { cost: 100, purchasedAtRankId: "trooper" },
      },
    });
    expect(owned).toHaveLength(1);
  });

  it("keeps unowned catalogue Skills untrained and available to pick", () => {
    const result = buildSkillCatalogue([{ ...MOCK_DEFAULT_SKILLS[0], level: "trained" }]);

    expect(result).toHaveLength(3);
    expect(result.find((skill) => skill.id === "athletics")?.level).toBe("untrained");
    expect(result.find((skill) => skill.id === "logic")?.level).toBe("untrained");
  });

  it("uses current catalogue metadata while retaining owned progress", () => {
    const result = buildSkillCatalogue([
      {
        ...MOCK_DEFAULT_SKILLS[0],
        name: "Old Acrobatics",
        characteristic: "wp",
        level: "trained",
      },
    ]);

    expect(result[0]).toMatchObject({
      name: "Acrobatics",
      characteristic: "ag",
      level: "trained",
    });
  });

  it("does not silently hide an explicitly owned Skill missing from the catalogue", () => {
    const removedSkill: SkillEntry = {
      id: "removed-skill",
      name: "Removed Skill",
      characteristic: "wp",
      level: "trained",
      category: "Legacy",
      advanced: true,
      source: "CR",
    };

    expect(buildSkillCatalogue([removedSkill])).toContainEqual(removedSkill);
  });
});

describe("getSkillDefinition", () => {
  it("reads a Skill from the external catalogue", () => {
    expect(getSkillDefinition("logic")).toEqual(MOCK_DEFAULT_SKILLS[2]);
  });

  it("returns undefined for an unknown Skill", () => {
    expect(getSkillDefinition("missing")).toBeUndefined();
  });
});
