import { useCallback, useState } from "react";

interface UseAssignedItemMetaOptions {
  requiresCost?: boolean;
  requiresWeight?: boolean;
  requiresRarity: boolean;
  /** The lowest cost that may be entered, for an item priced with a plus sign. */
  minimumCost?: number;
}

export function useAssignedItemMeta({
  requiresCost = true,
  requiresWeight = false,
  requiresRarity,
  minimumCost = 0,
}: UseAssignedItemMetaOptions) {
  const [gmCost, setGmCost] = useState("");
  const [gmWeight, setGmWeight] = useState("");
  const [gmRarity, setGmRarity] = useState("");
  const [showRarityPicker, setShowRarityPicker] = useState(false);

  const costNum = Number(gmCost);
  const costValid =
    !requiresCost || (gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= minimumCost);
  const weightValid = !requiresWeight || gmWeight.trim() !== "";
  const canConfirm = costValid && weightValid && (!requiresRarity || gmRarity !== "");

  const resetAssignedItemMeta = useCallback(() => {
    setGmCost("");
    setGmWeight("");
    setGmRarity("");
    setShowRarityPicker(false);
  }, []);

  return {
    gmCost,
    setGmCost,
    gmWeight,
    setGmWeight,
    gmRarity,
    setGmRarity,
    showRarityPicker,
    setShowRarityPicker,
    costValid,
    canConfirm,
    resetAssignedItemMeta,
  };
}
