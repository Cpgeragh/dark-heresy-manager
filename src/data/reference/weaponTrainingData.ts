// src/data/reference/weaponTrainingData.ts
// Moved to shared-rules/src/weaponTrainingData.ts so functions/ can read the same weapon
// training groups the app does. Re-exports everything so every existing import of this path
// keeps working.

export * from "shared-rules/dist/weaponTrainingData.js";
