// src/hooks/useSkillComputation.ts

import { useMemo } from "react";
import type { SkillEntry, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { SKILL_ADVANCE_VALUES, SKILL_HALF_DIVISOR } from "../constants/gameRules";
import { calculateCharacteristicTotal } from "../utils/stats";

export type SkillWithComputed = SkillEntry & {
  total: number | null;
  half: number | null;
  full: number | null;
};

function computeTotal(
  skill: SkillEntry,
  getCharField: (key: keyof Characteristics) => CharField
): number | null {
  const charField = getCharField(skill.characteristic);
  const charTotal = calculateCharacteristicTotal(charField.base, charField.advances);
  const misc = skill.miscModifier ?? 0;

  if (skill.level === "untrained") {
    return skill.advanced ? null : Math.floor(charTotal / SKILL_HALF_DIVISOR);
  }

  const levelMod =
    skill.level === "trained"
      ? SKILL_ADVANCE_VALUES.trained
      : skill.level === "+10"
        ? SKILL_ADVANCE_VALUES["+10"]
        : SKILL_ADVANCE_VALUES["+20"];

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
          half: s.level === "untrained" && !s.advanced
            ? total
            : total !== null ? Math.floor(total / SKILL_HALF_DIVISOR) : null,
          full: total,
          };
      }),
    [skills, getCharField]
  );
}
