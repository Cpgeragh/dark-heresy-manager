// src/data/reference/careerData.ts
// Moved to shared-rules/src/careerData.ts so functions/ can use the exact same
// career data for real XP-cost validation, see project_server_side_rule_validation_plan
// in memory. Re-exports everything so every existing import of this path keeps working.

export * from "shared-rules/dist/careerData.js";
