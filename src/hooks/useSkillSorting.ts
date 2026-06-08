// src/hooks/useSkillSorting.ts

import { useMemo } from "react";
import type { SkillWithComputed } from "./useSkillComputation";
import { GROUP_ORDER, type SortMode } from "../pages/characterSheet/SkillsTab/skillsConstants";

interface UseSkillSortingArgs {
  skills: SkillWithComputed[];
  sortMode: SortMode;
}

export function useSkillSorting({ skills, sortMode }: UseSkillSortingArgs): SkillWithComputed[] {
  return useMemo(() => {
    const arr = [...skills]; // Create copy to avoid mutating original

    if (sortMode === "name") {
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortMode === "total") {
      return arr.sort((a, b) => (b.total ?? -999) - (a.total ?? -999));
    }

    if (sortMode === "characteristic") {
      return arr.sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a.characteristic);
        const bi = GROUP_ORDER.indexOf(b.characteristic);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
    }

    if (sortMode === "category") {
      return arr.sort((a, b) => {
        const ac = a.category ?? "";
        const bc = b.category ?? "";
        if (ac !== bc) return ac.localeCompare(bc);
        return a.name.localeCompare(b.name);
      });
    }

    return arr;
  }, [skills, sortMode]);
}
