import type { PsychicDiscipline } from "../../data/reference/psychicReference";

export function psychicDisciplineColour(discipline?: string | null): string {
  switch (discipline as PsychicDiscipline | undefined) {
    case "Minor":
      return "border-violet-500/50 bg-violet-500/10 text-violet-300";
    case "Biomancy":
      return "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
    case "Divination":
      return "border-cyan-500/50 bg-cyan-500/10 text-cyan-300";
    case "Pyromancy":
      return "border-orange-500/50 bg-orange-500/10 text-orange-300";
    case "Telekinetics":
      return "border-sky-500/50 bg-sky-500/10 text-sky-300";
    case "Telepathy":
      return "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300";
    default:
      return "border-slate-600 bg-slate-800/40 text-slate-300";
  }
}

export function powerGroupActiveColour(group: "minor" | "major"): string {
  return group === "minor"
    ? "border-violet-400 bg-violet-600/80 text-white shadow-sm shadow-violet-950/50"
    : "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50";
}

export function psyRatingGlow(psyRating: number): string {
  const capped = Math.max(0, Math.min(6, psyRating));
  switch (capped) {
    case 1:
      return "shadow-[0_0_6px_rgba(129,140,248,0.35)]";
    case 2:
      return "shadow-[0_0_9px_rgba(129,140,248,0.45)]";
    case 3:
      return "shadow-[0_0_12px_rgba(129,140,248,0.55)]";
    case 4:
      return "shadow-[0_0_15px_rgba(129,140,248,0.65)]";
    case 5:
      return "shadow-[0_0_19px_rgba(129,140,248,0.75)]";
    case 6:
      return "shadow-[0_0_24px_rgba(129,140,248,0.9)]";
    default:
      return "shadow-none";
  }
}
