// src/utils/skillUtils.ts

import { DEFAULT_SKILLS } from "../data/defaultSkills";
import type { SkillEntry } from "../types/Character";

/**
 * Merges a character's saved skills with the current DEFAULT_SKILLS list.
 * Preserves the player's trained level, miscModifier, and notes for each skill,
 * while picking up any metadata changes (name, characteristic, category, source)
 * and any new skills added to DEFAULT_SKILLS.
 */
export function normaliseSkills(raw: unknown): SkillEntry[] {
  if (!Array.isArray(raw)) return DEFAULT_SKILLS;

  const savedById = new Map(
    (raw as SkillEntry[]).map((skill) => [skill.id, skill])
  );

  return DEFAULT_SKILLS.map((skill) => {
    const saved = savedById.get(skill.id);
    if (!saved) return skill;

    return {
      ...skill,
      level: saved.level ?? skill.level,
      miscModifier: saved.miscModifier,
      notes: saved.notes,
    };
  });
}

/**
 * Returns true if the character's saved skills differ from the normalised version,
 * indicating a Firestore write is needed to sync them with DEFAULT_SKILLS.
 * Detects: new skills added, metadata changes, ordering changes.
 */
export function skillsNeedNormalisation(raw: unknown, normalised = normaliseSkills(raw)): boolean {
  if (!Array.isArray(raw)) return true;

  const current = raw as SkillEntry[];
  if (current.length !== normalised.length) return true;

  return normalised.some((skill, index) => {
    const saved = current[index];
    return (
      !saved ||
      saved.id !== skill.id ||
      saved.name !== skill.name ||
      saved.characteristic !== skill.characteristic ||
      saved.level !== skill.level ||
      saved.category !== skill.category ||
      saved.advanced !== skill.advanced ||
      saved.source !== skill.source ||
      saved.miscModifier !== skill.miscModifier ||
      saved.notes !== skill.notes
    );
  });
}
