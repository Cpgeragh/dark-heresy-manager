// src/utils/skillUtils.ts

import { DEFAULT_SKILLS } from "../data/defaultSkills";
import type { SkillEntry } from "../types/Character";

/**
 * Builds the complete Skill catalogue used by the Skills page without changing
 * the character's saved data. Character.skills contains owned Skill progress;
 * DEFAULT_SKILLS supplies every untrained picker option and canonical metadata.
 */
export function buildSkillCatalogue(ownedSkills: readonly SkillEntry[]): SkillEntry[] {
  const ownedById = new Map(ownedSkills.map((skill) => [skill.id, skill]));
  const referenceIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));

  const catalogue = DEFAULT_SKILLS.map((definition) => {
    const owned = ownedById.get(definition.id);
    if (!owned) return definition;

    return {
      ...definition,
      level: owned.level,
      notes: owned.notes,
      manualCosts: owned.manualCosts,
      xpPurchases: owned.xpPurchases,
    };
  });

  // Keep an explicitly owned entry visible if its reference definition is ever
  // removed or renamed. It must not be silently discarded from character data.
  return [...catalogue, ...ownedSkills.filter((skill) => !referenceIds.has(skill.id))];
}

export function getSkillDefinition(skillId: string): SkillEntry | undefined {
  return DEFAULT_SKILLS.find((skill) => skill.id === skillId);
}
