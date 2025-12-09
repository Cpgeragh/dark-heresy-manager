// src/data/skillGroups.ts

/**
 * Groups skills under human-readable headings
 * purely for UI sorting convenience.
 */
export const SKILL_GROUPS: Record<string, string[]> = {
  Awareness: ["awareness"],
  Social: ["barter", "charm", "command", "deceive", "inquiry"],
  Physical: ["carouse", "dodge", "intimidate", "silent_move", "shadowing"],
  Investigation: ["evaluate", "scrutiny", "search"],
  Knowledge: ["literacy", "logic", "navigation", "speak_language"],
  Survival: ["survival"],
  Technical: ["security", "tech_use"],
};