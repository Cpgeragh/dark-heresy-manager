// src/hooks/useSkillComputation.ts

import { useMemo } from "react";
import type {
  SkillEntry,
  Characteristics,
  SkillAdvanceLevel,
  TalentsAndTraitsBlock,
} from "../types/Character";
import type { CharField } from "../types/Character";
import type { CharacteristicTotals } from "../mechanics/corruption/characteristicModifierTotals";
import { SKILL_ADVANCE_VALUES, SKILL_HALF_DIVISOR } from "../constants/gameRules";
import { calculateCharacteristicTotal } from "../utils/stats";
import {
  getTalentSkillEffects,
  type TalentModifierSource,
} from "../mechanics/talents/talentEffects";

export type SkillWithComputed = SkillEntry & {
  total: number | null;
  talentAdjustment?: number;
  talentSources?: TalentModifierSource[];
  talentMinimumLevel?: SkillAdvanceLevel;
  baseLevel?: SkillAdvanceLevel;
};

const LEVEL_RANK: Record<SkillAdvanceLevel, number> = {
  untrained: 0,
  trained: 1,
  "+10": 2,
  "+20": 3,
};

function computeTotal(
  skill: SkillEntry,
  getCharField: (key: keyof Characteristics) => CharField,
  modifierTotals: CharacteristicTotals,
  talents?: TalentsAndTraitsBlock,
  career?: string
): number | null {
  const talentEffects = talents ? getTalentSkillEffects(talents, skill, career) : undefined;
  const characteristic = talentEffects?.characteristic ?? skill.characteristic;
  const charField = getCharField(characteristic);
  const rawCharTotal = calculateCharacteristicTotal(charField.base, charField.advances);
  const charTotal = Math.max(1, rawCharTotal + (modifierTotals[characteristic] ?? 0));
  const advanced = talentEffects?.countsAsBasic ? false : skill.advanced;
  const level =
    talentEffects?.minimumLevel && LEVEL_RANK[talentEffects.minimumLevel] > LEVEL_RANK[skill.level]
      ? talentEffects.minimumLevel
      : skill.level;

  if (level === "untrained") {
    const untrainedTotal = advanced
      ? charTotal
      : Math.max(1, Math.floor(charTotal / SKILL_HALF_DIVISOR));
    return untrainedTotal + (talentEffects?.modifier ?? 0);
  }

  const levelMod =
    level === "trained"
      ? SKILL_ADVANCE_VALUES.trained
      : level === "+10"
        ? SKILL_ADVANCE_VALUES["+10"]
        : SKILL_ADVANCE_VALUES["+20"];

  return charTotal + levelMod + (talentEffects?.modifier ?? 0);
}

interface UseSkillComputationArgs {
  skills: SkillEntry[];
  getCharField: (key: keyof Characteristics) => CharField;
  modifierTotals?: CharacteristicTotals;
  talents?: TalentsAndTraitsBlock;
  career?: string;
}

export function useSkillComputation({
  skills,
  getCharField,
  modifierTotals = {},
  talents,
  career,
}: UseSkillComputationArgs): SkillWithComputed[] {
  return useMemo(
    () =>
      skills.map((s) => {
        const effects = talents ? getTalentSkillEffects(talents, s, career) : undefined;
        const effectiveLevel =
          effects?.minimumLevel && LEVEL_RANK[effects.minimumLevel] > LEVEL_RANK[s.level]
            ? effects.minimumLevel
            : s.level;
        const total = computeTotal(s, getCharField, modifierTotals, talents, career);
        return {
          ...s,
          ...(effects?.characteristic ? { characteristic: effects.characteristic } : {}),
          ...(effects?.countsAsBasic ? { advanced: false } : {}),
          level: effectiveLevel,
          baseLevel: s.level,
          total,
          ...(effects?.minimumLevel ? { talentMinimumLevel: effects.minimumLevel } : {}),
          ...(effects && effects.sources.length > 0
            ? {
                talentAdjustment: effects.modifier,
                talentSources: effects.sources,
              }
            : {}),
        };
      }),
    [skills, getCharField, modifierTotals, talents, career]
  );
}
