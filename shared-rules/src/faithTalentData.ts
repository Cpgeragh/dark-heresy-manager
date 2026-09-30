import { SkillSource } from "./skillSource.js";

export interface FaithTalentRulesData {
  source: typeof SkillSource.IH;
  foundationTalentId: "pure-faith";
  corruptionRestriction: string;
  warpEntityDefinition: string;
}

/** Shared rules printed with The Inquisitor's Handbook Faith Talents. */
export const FAITH_TALENT_RULES: FaithTalentRulesData = {
  source: SkillSource.IH,
  foundationTalentId: "pure-faith",
  corruptionRestriction:
    "A character with more than 10 Corruption Points may not use or acquire Faith Talents. If their Corruption Points are reduced below 10, they may use and acquire Faith Talents again.",
  warpEntityDefinition:
    "The terms warp creature and warp entity include all Daemons and Daemonhosts, Astral Spectres, possessing entities, and other beings of the warp.",
};
