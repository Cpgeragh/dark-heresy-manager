// src/mechanics/experience/weaponTrainingAdvanceCosts.ts
// Moved to shared-rules/src/weaponTrainingAdvanceCosts.ts so functions/ can check Weapon
// Training costs with the same logic the app uses. Re-exports everything so existing imports
// keep working. getWeaponTrainingSpent now takes the narrower CharacterForWeaponTrainingCosts
// shape instead of this app's own Character, but every real Character already satisfies it.

export * from "shared-rules/dist/weaponTrainingAdvanceCosts.js";
