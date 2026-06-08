// src/utils/skillFilters.ts

import type { SkillEntry } from "../types/Character";
import { SkillSource } from "../types/SkillSource";

export function filterSkills(
  skills: SkillEntry[],
  options: {
    category?: string;
    source?: SkillSource;
    characteristic?: string;
    advanced?: boolean;
  }
) {
  return skills.filter(
    (s) =>
      (options.category ? s.category === options.category : true) &&
      (options.source ? s.source === options.source : true) &&
      (options.characteristic ? s.characteristic === options.characteristic : true) &&
      (options.advanced !== undefined ? s.advanced === options.advanced : true)
  );
}
