// src/utils/characterMigration.ts
// Normalisation helpers for legacy Firestore character documents.
//
// Old documents store armour as ArmourBlock (fixed 6-location object) and
// gear as string[]. These functions convert both to the current shapes so the
// rest of the app can work with a single consistent format.

import { DEFAULT_SKILLS } from "../data/defaultSkills";
import type { ArmourLocationKey, GearItem, SkillEntry, WornArmourPiece } from "../types/Character";

const LOCATION_KEYS: ArmourLocationKey[] = [
  "head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg",
];

export function normaliseArmour(raw: unknown): WornArmourPiece[] {
  if (Array.isArray(raw)) return raw as WornArmourPiece[];
  // Legacy ArmourBlock — convert each non-zero location into a piece
  const block = raw as Record<string, { name?: string; ap?: number; type?: string }> | null;
  if (!block) return [];
  return LOCATION_KEYS
    .filter((k) => (block[k]?.ap ?? 0) > 0)
    .map((k) => ({
      id: crypto.randomUUID(),
      name: block[k]?.type || block[k]?.name || k,
      locations: [k],
      ap: block[k]?.ap ?? 0,
      worn: true,
    }));
}

export function normaliseGear(raw: unknown): GearItem[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).map((item) => {
    if (typeof item === "string") {
      return { id: crypto.randomUUID(), name: item };
    }
    return item as GearItem;
  });
}

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
