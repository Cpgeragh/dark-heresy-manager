// src/hooks/useSkillFiltering.ts

import { useMemo } from "react";
import type { SkillWithComputed } from "./useSkillComputation";

interface UseSkillFilteringArgs {
  skills: SkillWithComputed[];
  searchQuery: string;
  showOnlyTrained: boolean;
}

export function useSkillFiltering({
  skills,
  searchQuery,
  showOnlyTrained,
}: UseSkillFilteringArgs): SkillWithComputed[] {
  return useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return skills.filter((s) => {
      if (showOnlyTrained && s.level === "untrained") return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [skills, searchQuery, showOnlyTrained]);
}