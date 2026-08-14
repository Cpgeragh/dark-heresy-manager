// src/hooks/useCharacterHelpers.ts

import { useCallback } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../types/Character";
import { calculateCharacteristicTotal } from "../utils/stats";
import { getCharacteristicModifierTotals } from "../features/corruption/characteristicModifierTotals";
import { CHARACTERISTIC_LABELS } from "../features/corruption/characteristicModifiers";
import { CHARACTERISTIC_BONUS_DIVISOR } from "../constants/gameRules";

interface UseCharacterHelpersProps {
  character: Character | null;
}

export function useCharacterHelpers({ character }: UseCharacterHelpersProps) {
  const getCharField = useCallback(
    (statKey: keyof Characteristics): CharField => {
      if (!character) return { base: 0, advances: 0 };
      return character.characteristics[statKey] ?? { base: 0, advances: 0 };
    },
    [character]
  );

  const getCharTotal = useCallback(
    (statKey: keyof Characteristics): number => {
      const field = getCharField(statKey);
      return calculateCharacteristicTotal(field.base, field.advances);
    },
    [getCharField]
  );

  const getEffectiveCharTotal = useCallback(
    (statKey: keyof Characteristics): number => {
      const rawTotal = getCharTotal(statKey);
      if (!character) return rawTotal;
      const modifierTotals = getCharacteristicModifierTotals(
        character.corruption,
        character.talentsAndTraits
      );
      return Math.max(1, rawTotal + (modifierTotals[statKey] ?? 0));
    },
    [character, getCharTotal]
  );

  const getCharBonus = useCallback(
    (statKey: keyof Characteristics): number => {
      const baseBonus = Math.floor(getEffectiveCharTotal(statKey) / CHARACTERISTIC_BONUS_DIVISOR);
      const traits = character?.talentsAndTraits.traits ?? [];
      const unnaturalCount = traits.filter(
        (t) => t.talentId === "unnatural-characteristic" && t.specialisation === CHARACTERISTIC_LABELS[statKey]
      ).length;
      return baseBonus * (1 + unnaturalCount);
    },
    [getEffectiveCharTotal, character]
  );

  return {
    getCharField,
    getCharTotal,
    getEffectiveCharTotal,
    getCharBonus,
  };
}
