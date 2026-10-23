import { useCallback, useState } from "react";

interface UseAssignedItemMetaOptions {
  requiresCost?: boolean;
  requiresWeight?: boolean;
  requiresRarity: boolean;
}

export function useAssignedItemMeta({
  requiresCost = true,
  requiresWeight = false,
  requiresRarity,
}: UseAssignedItemMetaOptions) {
  const [gmCost, setGmCost] = useState("");
  const [gmWeight, setGmWeight] = useState("");
  const [gmRarity, setGmRarity] = useState("");
  const [showRarityPicker, setShowRarityPicker] = useState(false);

  const costNum = Number(gmCost);
  const costValid =
    !requiresCost || (gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 0);
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
