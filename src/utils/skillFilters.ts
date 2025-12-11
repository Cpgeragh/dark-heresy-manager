import type { SkillEntry } from "../types/Character";
import { SkillSource } from "../types/SkillSource";

export function filterByCategory(skills: SkillEntry[], category: string) {
  return skills.filter(s => s.category === category);
}

export function filterBySource(skills: SkillEntry[], source: SkillSource) {
  return skills.filter(s => s.source === source);
}

export function filterByCharacteristic(skills: SkillEntry[], characteristic: string) {
  return skills.filter(s => s.characteristic === characteristic);
}

export function filterAdvanced(skills: SkillEntry[], isAdvanced: boolean) {
  return skills.filter(s => s.advanced === isAdvanced);
}

export function filterSkills(
  skills: SkillEntry[],
  options: {
    category?: string;
    source?: SkillSource;
    characteristic?: string;
    advanced?: boolean;
  }
) {
  return skills.filter(s =>
    (options.category ? s.category === options.category : true) &&
    (options.source ? s.source === options.source : true) &&
    (options.characteristic ? s.characteristic === options.characteristic : true) &&
    (options.advanced !== undefined ? s.advanced === options.advanced : true)
  );
}