// src/hooks/usePsychicPowers.ts

import { useCallback } from "react";
import type { PsychicBlock, PsychicPower } from "../types/Character";

type PowerType = "minorPowers" | "majorPowers";

interface UsePsychicPowersProps {
  psychic: PsychicBlock;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

/**
 * Hook to manage psychic power arrays (minor and major).
 * Provides generic add, remove, and update operations.
 * 
 * @param psychic - The psychic block
 * @param editable - Whether powers can be edited
 * @param onUpdate - Callback to update the entire psychic block
 */
export function usePsychicPowers({
  psychic,
  editable,
  onUpdate,
}: UsePsychicPowersProps) {
  /**
   * Generic function to add a new power to a power array
   */
  const addPower = useCallback(
    (type: PowerType) => {
      if (!editable) return;

      const isMinor = type === "minorPowers";
      const newPower: PsychicPower = {
        id: crypto.randomUUID(),
        name: "",
        known: true,
        isMinor,
      };

      onUpdate({
        ...psychic,
        [type]: [...psychic[type], newPower],
      });
    },
    [editable, psychic, onUpdate]
  );

  /**
   * Generic function to remove a power from a power array
   */
  const removePower = useCallback(
    (type: PowerType, index: number) => {
      if (!editable) return;

      const powers = [...psychic[type]];
      powers.splice(index, 1);

      onUpdate({
        ...psychic,
        [type]: powers,
      });
    },
    [editable, psychic, onUpdate]
  );

  /**
   * Generic function to update a specific field of a power
   */
  const updatePower = useCallback(
    (type: PowerType, index: number, key: keyof PsychicPower, value: any) => {
      if (!editable) return;

      const powers = [...psychic[type]];
      powers[index] = { ...powers[index], [key]: value };

      onUpdate({
        ...psychic,
        [type]: powers,
      });
    },
    [editable, psychic, onUpdate]
  );

  // ================================================================
  // SPECIFIC HELPERS (for cleaner usage in components)
  // ================================================================

  const addMinorPower = useCallback(() => addPower("minorPowers"), [addPower]);
  const addMajorPower = useCallback(() => addPower("majorPowers"), [addPower]);

  const removeMinorPower = useCallback(
    (index: number) => removePower("minorPowers", index),
    [removePower]
  );
  const removeMajorPower = useCallback(
    (index: number) => removePower("majorPowers", index),
    [removePower]
  );

  const updateMinorPower = useCallback(
    (index: number, key: keyof PsychicPower, value: any) =>
      updatePower("minorPowers", index, key, value),
    [updatePower]
  );
  const updateMajorPower = useCallback(
    (index: number, key: keyof PsychicPower, value: any) =>
      updatePower("majorPowers", index, key, value),
    [updatePower]
  );

  return {
    // Generic operations (can be used for new power types in the future)
    addPower,
    removePower,
    updatePower,

    // Specific operations (backwards compatible with original code)
    addMinorPower,
    addMajorPower,
    removeMinorPower,
    removeMajorPower,
    updateMinorPower,
    updateMajorPower,
  };
}