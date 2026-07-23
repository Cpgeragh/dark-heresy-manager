import type { SkillSource } from "../../types/SkillSource";

export function normaliseSources(source: SkillSource | SkillSource[]): SkillSource[] {
  return Array.isArray(source) ? source : [source];
}
