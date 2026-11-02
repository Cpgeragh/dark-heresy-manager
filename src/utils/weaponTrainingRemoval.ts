import type { WeaponTrainingBlock, WeaponTrainingTalentId } from "../types/Character";

/** The weapon training block with one fixed group taken away, along with its paid and Elite Advance records. */
export function removeWeaponTrainingGroup(
  weaponTraining: WeaponTrainingBlock,
  id: WeaponTrainingTalentId
): WeaponTrainingBlock {
  const xpPurchases = { ...weaponTraining.xpPurchases };
  const manualCosts = { ...weaponTraining.manualCosts };
  const eliteAdvancePurchases = { ...weaponTraining.eliteAdvancePurchases };
  delete xpPurchases[id];
  delete manualCosts[id];
  delete eliteAdvancePurchases[id];
  return {
    ...weaponTraining,
    trained: weaponTraining.trained.filter((trainedId) => trainedId !== id),
    xpPurchases: Object.keys(xpPurchases).length > 0 ? xpPurchases : undefined,
    manualCosts: Object.keys(manualCosts).length > 0 ? manualCosts : undefined,
    eliteAdvancePurchases:
      Object.keys(eliteAdvancePurchases).length > 0 ? eliteAdvancePurchases : undefined,
  };
}
