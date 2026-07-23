// src/hooks/useSkillComputation.ts

import { useMemo } from "react";
import type { SkillEntry, Characteristics } from "../types/Character";
import type { CharField } from "../types/Character";
import type { CharacteristicTotals } from "../features/corruption/characteristicModifierTotals";
import { SKILL_ADVANCE_VALUES, SKILL_HALF_DIVISOR } from "../constants/gameRules";
import { calculateCharacteristicTotal } from "../utils/stats";

export type SkillWithComputed = SkillEntry & {
  total: number | null;
};

function computeTotal(
  skill: SkillEntry,
  getCharField: (key: keyof Characteristics) => CharField,
  modifierTotals: CharacteristicTotals
): number | null {
  const charField = getCharField(skill.characteristic);
  const rawCharTotal = calculateCharacteristicTotal(charField.base, charField.advances);
  const charTotal = Math.max(1, rawCharTotal + (modifierTotals[skill.characteristic] ?? 0));

  if (skill.level === "untrained") {
    return skill.advanced ? charTotal : Math.floor(charTotal / SKILL_HALF_DIVISOR);
  }

  const levelMod =
    skill.level === "trained"
      ? SKILL_ADVANCE_VALUES.trained
      : skill.level === "+10"
        ? SKILL_ADVANCE_VALUES["+10"]
        : SKILL_ADVANCE_VALUES["+20"];

  return charTotal + levelMod;
}

interface UseSkillComputationArgs {
  skills: SkillEntry[];
  getCharField: (key: keyof Characteristics) => CharField;
  modifierTotals?: CharacteristicTotals;
}

export function useSkillComputation({
  skills,
  getCharField,
  modifierTotals = {},
}: UseSkillComputationArgs): SkillWithComputed[] {
  return useMemo(
    () =>
      skills.map((s) => {
        const total = computeTotal(s, getCharField, modifierTotals);
        return { ...s, total };
      }),
    [skills, getCharField, modifierTotals]
  );
}
