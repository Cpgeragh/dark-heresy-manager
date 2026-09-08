// src/hooks/useCharacterHelpers.ts

import { useCallback, useMemo } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../types/Character";
import { calculateCharacteristicTotal } from "../utils/stats";
import {
  getCharacteristicModifierBreakdown,
  type CharacteristicModifierBreakdown,
} from "../mechanics/corruption/characteristicModifierTotals";
import { CHARACTERISTIC_LABELS } from "../mechanics/corruption/characteristicModifiers";
import { CHARACTERISTIC_BONUS_DIVISOR } from "../constants/gameRules";

interface UseCharacterHelpersProps {
  character: Character | null;
}

const EMPTY_CHARACTERISTIC_MODIFIER_BREAKDOWN: CharacteristicModifierBreakdown = {
  totals: {},
  sources: {},
};

export function useCharacterHelpers({ character }: UseCharacterHelpersProps) {
  const hasCharacter = character !== null;
  const characteristics = character?.characteristics;
  const corruption = character?.corruption;
  const talentsAndTraits = character?.talentsAndTraits;
  const career = character?.header?.career;
  const modifierBreakdown = useMemo(
    () =>
      corruption
        ? getCharacteristicModifierBreakdown(corruption, talentsAndTraits, career)
        : EMPTY_CHARACTERISTIC_MODIFIER_BREAKDOWN,
    [career, corruption, talentsAndTraits]
  );
  const unnaturalCounts = useMemo(() => {
    const counts: Partial<Record<keyof Characteristics, number>> = {};
    const keyByLabel = new Map(
      Object.entries(CHARACTERISTIC_LABELS).map(([key, label]) => [
        label,
        key as keyof Characteristics,
      ])
    );
    for (const trait of talentsAndTraits?.traits ?? []) {
      if (trait.talentId !== "unnatural-characteristic" || !trait.specialisation) continue;
      const key = keyByLabel.get(trait.specialisation);
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [talentsAndTraits?.traits]);

  const getCharField = useCallback(
    (statKey: keyof Characteristics): CharField => {
      if (!characteristics) return { base: 0, advances: 0 };
      return characteristics[statKey] ?? { base: 0, advances: 0 };
    },
    [characteristics]
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
      if (!hasCharacter) return rawTotal;
      return Math.max(1, rawTotal + (modifierBreakdown.totals[statKey] ?? 0));
    },
    [getCharTotal, hasCharacter, modifierBreakdown.totals]
  );

  const getCharBonus = useCallback(
    (statKey: keyof Characteristics): number => {
      const baseBonus = Math.floor(getEffectiveCharTotal(statKey) / CHARACTERISTIC_BONUS_DIVISOR);
      return baseBonus * (1 + (unnaturalCounts[statKey] ?? 0));
    },
    [getEffectiveCharTotal, unnaturalCounts]
  );

  return {
    getCharField,
    getCharTotal,
    getEffectiveCharTotal,
    getCharBonus,
    characteristicModifierTotals: modifierBreakdown.totals,
    characteristicModifierSources: modifierBreakdown.sources,
  };
}
