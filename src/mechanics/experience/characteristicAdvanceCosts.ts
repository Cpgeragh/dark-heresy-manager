// src/mechanics/experience/characteristicAdvanceCosts.ts
// Moved to shared-rules/src/characteristicAdvanceCosts.ts, see
// ../../data/reference/careerData.ts's comment for why. Re-exports everything so
// existing imports keep working. getCharacteristicAdvancesSpent now takes the
// narrower CharacterForCharacteristicCosts shape instead of this app's own Character,
// but every real Character already satisfies it.

export * from "shared-rules/dist/characteristicAdvanceCosts.js";
