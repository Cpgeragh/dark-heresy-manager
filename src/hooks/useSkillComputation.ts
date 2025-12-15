// src/hooks/useSkillComputation.ts

import { useMemo } from "react";
import type { SkillEntry, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";

export type SkillWithComputed = SkillEntry & {
  total: number | null;
  half: number | null;
  full: number | null;
  opposed: number | null;
};

function computeTotal(
  skill: SkillEntry,
  getCharField: (key: keyof Characteristics) => CharField
): number | null {
  const charField = getCharField(skill.characteristic);
  const charTotal = charField.base + charField.advances;
  const misc = skill.miscModifier ?? 0;

  const levelMod =
    skill.level === "trained"
      ? 0
      : skill.level === "+10"
      ? 10
      : skill.level === "+20"
      ? 20
      : -20;

  return charTotal + levelMod + misc;
}

interface UseSkillComputationArgs {
  skills: SkillEntry[];
  getCharField: (key: keyof Characteristics) => CharField;
}

export function useSkillComputation({
  skills,
  getCharField,
}: UseSkillComputationArgs): SkillWithComputed[] {
  return useMemo(
    () =>
      skills.map((s) => {
        const total = computeTotal(s, getCharField);
        return {
          ...s,
          total,
          half: total !== null ? Math.floor(total / 2) : null,
          full: total,
          opposed: total,
        };
      }),
    [skills, getCharField]
  );
}