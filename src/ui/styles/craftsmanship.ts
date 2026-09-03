import type { CyberneticCraftsmanship, StandardCraftsmanship } from "../../types/Character";

export const CRAFTSMANSHIP_OPTIONS = ["Poor", "Common", "Good", "Best"] as const satisfies readonly StandardCraftsmanship[];
export const CYBERNETIC_CRAFTSMANSHIP_OPTIONS = CRAFTSMANSHIP_OPTIONS.filter(
  (option): option is CyberneticCraftsmanship => option !== "Best"
);

export const CRAFTSMANSHIP_STYLE: Record<StandardCraftsmanship, string> = {
  Poor: "border-red-500/70 bg-red-500/15 text-red-300",
  Common: "border-slate-500 bg-slate-800 text-slate-200",
  Good: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
  Best: "border-amber-400 bg-amber-500/20 text-amber-300",
};
