// src/hooks/useCharacterHelpers.ts

import { useCallback } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { calculateCharacteristicTotal } from "../utils/stats";

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

  return {
    getCharField,
    getCharTotal,
  };
}
