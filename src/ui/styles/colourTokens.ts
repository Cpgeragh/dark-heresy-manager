// src/ui/styles/colourTokens.ts

export const colourSuccessPlain = "text-emerald-400";
export const colourAmberPlain = "text-amber-300";
export const colourMetadataLabelText = "text-sky-300/85";
export const colourTextPrimary = "text-slate-200";
export const colourDivider = "border-slate-700";
export const colourControlSurface = "border-slate-600 bg-slate-800";
export const colourPopoverSurface = "bg-slate-900 border-slate-700";
export const colourPageBackground = "bg-slate-950";
export const colourControlSurfaceDisabled = "border-slate-700 bg-slate-800/50";
export const colourControlDivider = "bg-slate-600";
export const colourControlDividerDisabled = "bg-slate-700";
export const colourControlShadow = "shadow-lg shadow-black/40";
export const colourSplashRule = "border-slate-800";
export const colourEditOverrideSurface = "border-amber-400 bg-amber-500/10";
export const colourOverlayBackdrop = "bg-slate-950/60";
export const colourErrorText = "text-red-400";
export const colourRequiredText = colourErrorText;
export const colourDivideList = "divide-slate-700";
export const colourAccentBar = "border-red-700";
export const colourBorderRed = "border-red-500";
export const colourBorderControl = "border-slate-600";
export const colourControlRaised = "border-slate-600 bg-slate-700";
export const colourStateRed = "border-red-500 bg-red-500/20";
export const colourAdvanceFilled = "bg-red-700 border-red-500";
export const colourAdvanceEmpty = "bg-slate-900 border-slate-600";
export const colourFillInset = "bg-slate-800/60";
export const colourFillPanel = "bg-slate-900";
export const colourFillRaised = "bg-slate-700";
export const colourFillControl = "bg-slate-800";
export const colourFillSelected = "bg-slate-800/70";
export const colourFillHeader = "bg-slate-900/80";
export const colourFillFloating = "bg-slate-900/90";
export const colourModalSurface = "bg-slate-900 border-slate-500";
export const colourTabTrackSurface = "border-slate-600 bg-slate-950/70";
export const colourTimelineMarker = "bg-slate-100";
export const colourQrBackground = "bg-white";
export const colourDotLoaded = "bg-green-400";
export const colourDotIdle = "bg-slate-600";
export const colourTextMuted = "text-slate-400";
export const colourTextBody = "text-slate-300";
export const colourTextPlaceholder = "text-slate-500";
export const colourTextGMNote = "text-amber-400/70";
export const colourCustomEntryText = "text-fuchsia-400";
export const colourHeadingAccent = "text-red-500";
export const colourNoticeAmberTitle = "text-amber-200";
export const colourNoticeAmberText = "text-amber-100/80";
export const colourAmberFill = "bg-amber-500 text-slate-900";
export const colourOnAmberDim = "text-amber-900/70";
export const colourSplashTitle = "text-red-600";
export const colourTerminalText = "text-rose-300";
export const colourPsychicText = "text-indigo-300";
export const colourDrugNoticeText = "text-violet-400";
export const colourToggleSelectedRed = "border-red-500 bg-red-500/20 text-red-400 font-semibold";
export const colourToggleSelectedAmberSoft = "border-amber-600 bg-amber-600/20 text-amber-400";
export const colourToggleSelectedViolet =
  "border-violet-400 bg-violet-600/80 text-white shadow-sm shadow-violet-950/50";
export const colourToggleSelectedFuchsia =
  "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50";

/** Text colour of a track step in the Insanity and Corruption steppers, by how far along the track it is. */
export const degreeTextColour = {
  first: "text-sky-200",
  second: "text-amber-200",
  third: "text-orange-200",
  fourth: "text-fuchsia-200",
  terminal: `${colourTerminalText} animate-pulse`,
} as const;

/** Bar fill of a segment in the Insanity and Corruption timelines, bright when reached and dim otherwise. */
export const degreeBarColour = {
  stable: { bright: "bg-emerald-500/70", dim: "bg-emerald-500/35" },
  first: { bright: "bg-sky-500/70", dim: "bg-sky-500/35" },
  second: { bright: "bg-amber-500/70", dim: "bg-amber-500/35" },
  third: { bright: "bg-orange-500/70", dim: "bg-orange-500/35" },
  fourth: { bright: "bg-fuchsia-500/70", dim: "bg-fuchsia-500/35" },
  neutral: { bright: "bg-slate-500/70", dim: "bg-slate-500/35" },
} as const;

/** Text colour of the damage type letter on a weapon. */
export const damageTypeTextColour = {
  impact: "text-blue-400",
  rending: colourErrorText,
  energy: "text-orange-400",
  explosive: "text-yellow-400",
} as const;

/** Fill, border and text of a toast, by its type. */
export const toastColours = {
  success: "bg-green-500/20 border-green-500 text-green-100",
  error: "bg-red-500/20 border-red-500 text-red-100",
  warning: "bg-amber-500/20 border-amber-500 text-amber-100",
  info: "bg-blue-500/20 border-blue-500 text-blue-100",
} as const;
export const colourCareerPathOutline =
  "border border-fuchsia-500 text-fuchsia-300 enabled:hover:bg-fuchsia-500/10 enabled:active:bg-fuchsia-500/20";
export const colourCareerPathOutlineMuted =
  "border border-fuchsia-500/50 text-fuchsia-300/60 enabled:hover:border-fuchsia-500/70 enabled:hover:bg-fuchsia-500/5 enabled:hover:text-fuchsia-300/80 enabled:active:bg-fuchsia-500/10";
export const colourCareerBranchOutline =
  "border border-emerald-500 text-emerald-300 enabled:hover:bg-emerald-500/10 enabled:active:bg-emerald-500/20";
export const colourCareerBranchOutlineMuted =
  "border border-emerald-500/50 text-emerald-300/60 enabled:hover:border-emerald-500/70 enabled:hover:bg-emerald-500/5 enabled:hover:text-emerald-300/80 enabled:active:bg-emerald-500/10";
export const colourButtonNeutralOutline = `border border-slate-500 ${colourTextPrimary} enabled:hover:bg-slate-800 enabled:active:bg-slate-700/75`;
export const colourToggleSelectedAmber =
  "border-amber-400 bg-amber-500 text-slate-900 font-semibold";
export const colourToggleSelectedNeutral = `border-slate-400 bg-slate-700/70 ${colourTextPrimary}`;
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
