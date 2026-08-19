import { useCallback, useState } from "react";

interface UseAssignedItemMetaOptions {
  requiresCost?: boolean;
  requiresRarity: boolean;
}

export function useAssignedItemMeta({ requiresCost = true, requiresRarity }: UseAssignedItemMetaOptions) {
  const [gmCost, setGmCost] = useState("");
  const [gmRarity, setGmRarity] = useState("");
  const [showRarityPicker, setShowRarityPicker] = useState(false);

  const costNum = Number(gmCost);
  const costValid = !requiresCost || (gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 0);
  const canConfirm = costValid && (!requiresRarity || gmRarity !== "");

  const resetAssignedItemMeta = useCallback(() => {
    setGmCost("");
    setGmRarity("");
    setShowRarityPicker(false);
  }, []);

  return {
    gmCost,
    setGmCost,
    gmRarity,
    setGmRarity,
    showRarityPicker,
    setShowRarityPicker,
    costValid,
    canConfirm,
    resetAssignedItemMeta,
  };
}
