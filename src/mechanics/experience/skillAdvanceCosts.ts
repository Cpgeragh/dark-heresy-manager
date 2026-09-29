// src/mechanics/experience/skillAdvanceCosts.ts
// Moved to shared-rules/src/skillAdvanceCosts.ts, see
// ../../data/reference/careerData.ts's comment for why. Re-exports everything so
// existing imports keep working. getSkillsSpent now takes the narrower
// CharacterForSkillCosts shape instead of this app's own Character, but every real
// Character already satisfies it.

export * from "shared-rules/dist/skillAdvanceCosts.js";
