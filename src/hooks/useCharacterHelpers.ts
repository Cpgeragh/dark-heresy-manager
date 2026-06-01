// src/hooks/useCharacterHelpers.ts

import { useCallback } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { CHARACTERISTIC_ADVANCE_INCREMENT } from "../constants/gameRules";

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
      return field.base + field.advances * CHARACTERISTIC_ADVANCE_INCREMENT;
    },
    [getCharField]
  );

  return {
    getCharField,
    getCharTotal,
  };
}