// src/hooks/useCharacterHelpers.ts

import { useCallback } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { CHARACTERISTIC_ADVANCE_INCREMENT } from "../constants/gameRules";

interface UseCharacterHelpersProps {
  character: Character | null;
}

/**
 * Hook providing helper functions for working with character characteristics.
 * 
 * @param character - The character object
 * @returns Helper functions for accessing characteristic data
 */
export function useCharacterHelpers({ character }: UseCharacterHelpersProps) {
  /**
   * Get a characteristic field (base + advances)
   */
  const getCharField = useCallback(
    (statKey: keyof Characteristics): CharField => {
      if (!character) return { base: 0, advances: 0 };
      return character.characteristics[statKey] ?? { base: 0, advances: 0 };
    },
    [character]
  );

  /**
   * Get computed total for a characteristic
   */
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