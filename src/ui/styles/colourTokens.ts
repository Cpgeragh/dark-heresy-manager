// src/ui/styles/colourTokens.ts

export const colourEmeraldPlain = "text-emerald-300";
export const colourSuccessPlain = "text-emerald-400";
export const colourAmberPlain = "text-amber-300";
export const colourSkyPlain = "text-sky-300";
export const colourMetadataLabelText = "text-sky-300/85";
export const colourTextPrimary = "text-slate-100";
export const colourOverlayBackdrop = "bg-slate-950/60";
export const colourRequiredText = "text-red-500";
export const colourCareerPathOutline =
  "border border-fuchsia-500 text-fuchsia-300 enabled:hover:bg-fuchsia-500/10 enabled:active:bg-fuchsia-500/20";
export const colourCareerPathOutlineMuted =
  "border border-fuchsia-500/50 text-fuchsia-300/60 enabled:hover:border-fuchsia-500/70 enabled:hover:bg-fuchsia-500/5 enabled:hover:text-fuchsia-300/80 enabled:active:bg-fuchsia-500/10";
export const colourCareerBranchOutline =
  "border border-emerald-500 text-emerald-300 enabled:hover:bg-emerald-500/10 enabled:active:bg-emerald-500/20";
export const colourCareerBranchOutlineMuted =
  "border border-emerald-500/50 text-emerald-300/60 enabled:hover:border-emerald-500/70 enabled:hover:bg-emerald-500/5 enabled:hover:text-emerald-300/80 enabled:active:bg-emerald-500/10";
export const colourButtonNeutralOutline =
  "border border-slate-500 text-slate-200 enabled:hover:bg-slate-800 enabled:active:bg-slate-700/75";
export const colourToggleSelectedNeutral = "border-slate-400 bg-slate-700/70 text-slate-100";
export const colourToggleSelectedSky = "border-sky-400 bg-sky-500/10 text-sky-300";
export const colourActiveSky =
  "border-sky-400 bg-sky-600/80 text-white shadow-sm shadow-sky-950/50";
export const colourActiveRose =
  "border-rose-400 bg-rose-600/80 text-white shadow-sm shadow-rose-950/50";
export const colourActiveOrange =
  "border-orange-400 bg-orange-600/80 text-white shadow-sm shadow-orange-950/50";
export const colourActiveEmerald =
  "border-emerald-400 bg-emerald-600/80 text-white shadow-sm shadow-emerald-950/50";
// Lighter "outlined" active/pressed style: border+text only, hover tint, no solid fill.
// Distinct from colourActiveXxx above (solid bg-600/80 fill + white text).
export const colourActiveOutlineTeal =
  "border-teal-400 text-teal-400 font-semibold hover:bg-teal-400/10";
export const colourActiveOutlineViolet =
  "border-violet-400 text-violet-400 font-semibold hover:bg-violet-400/10";
export const colourActiveOutlineOrange =
  "border-orange-400 text-orange-400 font-semibold hover:bg-orange-400/10";
export const colourActiveOutlineCyan =
  "border-cyan-400 text-cyan-300 font-semibold hover:bg-cyan-400/10";
export const colourActiveOutlineSky =
  "border-sky-400 text-sky-400 font-semibold hover:bg-sky-400/10";
export const colourActiveOutlineAmber =
  "border-amber-400 text-amber-400 font-semibold hover:bg-amber-400/10";
export const colourButtonOutlineOrange =
  "!border-orange-500 !text-orange-400 enabled:hover:!bg-orange-500/10";
export const colourButtonOutlineCyan =
  "!border-cyan-500 !text-cyan-300 enabled:hover:!bg-cyan-500/10";
// Same style, no hover: for static/non-interactive display (e.g. a chip that isn't itself clickable).
export const colourOutlineFuchsia = "border-fuchsia-400 text-fuchsia-400 font-semibold";
export const colourNoticeAmber = "border-amber-500/60 bg-amber-900/10";
export const colourNoticePink = "border-pink-500/60 bg-pink-900/10";
export const colourNoticeViolet = "border-violet-500/60 bg-violet-900/10";
export const colourNoticeRed = "border-red-500/60 bg-red-900/10";

export const chipColours = {
  slate: "border-slate-500/50 bg-slate-500/10 text-slate-300",
  red: "border-red-500/50 bg-red-500/10 text-red-300",
  amber: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  yellow: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
  lime: "border-lime-500/50 bg-lime-500/10 text-lime-300",
  green: "border-green-500/50 bg-green-500/10 text-green-300",
  emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  teal: "border-teal-500/50 bg-teal-500/10 text-teal-300",
  cyan: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
  sky: "border-sky-500/50 bg-sky-500/10 text-sky-300",
  blue: "border-blue-500/50 bg-blue-500/10 text-blue-300",
  indigo: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
  violet: "border-violet-500/50 bg-violet-500/10 text-violet-300",
  purple: "border-purple-500/50 bg-purple-500/10 text-purple-300",
  fuchsia: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300",
  pink: "border-pink-500/50 bg-pink-500/10 text-pink-300",
  rose: "border-rose-500/50 bg-rose-500/10 text-rose-300",
  orange: "border-orange-500/50 bg-orange-500/10 text-orange-300",
} as const;

export type ChipColour = keyof typeof chipColours;
/** Glowing pill look when owned or selected, one entry per colour. */
export const colourGlowActive = {
  teal: "border-teal-500/60 bg-teal-950/50 text-teal-300 font-semibold",
  violet: "border-violet-500/60 bg-violet-950/50 text-violet-300 font-semibold",
  orange: "border-orange-500/60 bg-orange-950/50 text-orange-300 font-semibold",
  sky: "border-sky-500/60 bg-sky-950/50 text-sky-300 font-semibold",
  amber: "border-amber-500/60 bg-amber-950/50 text-amber-300 font-semibold",
  emerald: "border-emerald-500/60 bg-emerald-950/50 text-emerald-300 font-semibold",
  cyan: "border-cyan-500/60 bg-cyan-950/50 text-cyan-300 font-semibold",
  fuchsia: "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300 font-semibold",
  indigo: "border-indigo-500/60 bg-indigo-950/50 text-indigo-300 font-semibold",
} as const;
/** The same pill look when not owned or not selected. */
export const colourGlowInactive = {
  teal: "border-teal-700/50 bg-teal-950/15 text-teal-400/50",
  violet: "border-violet-700/50 bg-violet-950/15 text-violet-400/50",
  orange: "border-orange-700/50 bg-orange-950/15 text-orange-400/50",
  sky: "border-sky-700/50 bg-sky-950/15 text-sky-400/50",
  amber: "border-amber-700/50 bg-amber-950/15 text-amber-400/50",
  emerald: "border-emerald-700/50 bg-emerald-950/15 text-emerald-400/50",
  cyan: "border-cyan-700/50 bg-cyan-950/15 text-cyan-400/50",
  fuchsia: "border-fuchsia-700/50 bg-fuchsia-950/15 text-fuchsia-400/50",
  indigo: "border-indigo-700/50 bg-indigo-950/15 text-indigo-400/50",
} as const;
