// src/utils/dmGatedPurchase.ts

/**
 * Whether a manual-cost / off-career purchase (training a locked Weapon
 * Training group, granting a bonus Exotic weapon outside the slot count,
 * buying an off-career Talent/Trait, upgrading an off-career Skill) can
 * actually be confirmed right now. The surrounding row, card, and any info
 * modals stay fully viewable to a player regardless, this only gates the
 * final confirm step.
 */
export function canConfirmManualCostPurchase(isDM: boolean): boolean {
  return isDM;
}
