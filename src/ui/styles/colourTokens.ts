// src/ui/styles/colourTokens.ts

/** Text colour of a chip or glow pill, one entry per colour. */
export const chipTextColours = {
  slate: "text-slate-300",
  red: "text-red-300",
  amber: "text-amber-300",
  yellow: "text-yellow-300",
  lime: "text-lime-300",
  green: "text-green-300",
  emerald: "text-emerald-300",
  teal: "text-teal-300",
  cyan: "text-cyan-300",
  sky: "text-sky-300",
  blue: "text-blue-300",
  indigo: "text-indigo-300",
  violet: "text-violet-300",
  purple: "text-purple-300",
  fuchsia: "text-fuchsia-300",
  pink: "text-pink-300",
  rose: "text-rose-300",
  orange: "text-orange-300",
} as const;

export const colourTextOnFill = "text-white";
export const colourBorderFuchsia = "border-fuchsia-500";
export const colourBorderAmber = "border-amber-500";
export const colourFillAmberFaint = "bg-amber-500/10";
export const colourBorderFuchsiaSoft = "border-fuchsia-500/50";
export const colourBorderEmeraldSoft = "border-emerald-500/50";
export const colourBorderAmberGlow = "border-amber-500/60";
export const colourBorderVioletGlow = "border-violet-500/60";

export const colourSuccessPlain = "text-emerald-400";
export const colourAmberPlain = chipTextColours.amber;
export const colourMetadataLabelText = "text-sky-300/85";
export const colourTextPrimary = "text-slate-200";
export const colourTextBody = chipTextColours.slate;
export const colourTextMuted = "text-slate-400";
export const colourErrorText = "text-red-400";
export const colourHeadingAccent = "text-red-500";
export const colourDivider = "border-slate-700";
export const colourBorderControl = "border-slate-600";
export const colourBorderSurface = "border-slate-500";
export const colourBorderRed = "border-red-500";
export const colourFillControl = "bg-slate-800";
export const colourFillPanel = "bg-slate-900";
export const colourFillRaised = "bg-slate-700";
export const colourFillCard = "bg-slate-900/60";
export const colourControlDivider = "bg-slate-600";
export const colourEnabledHoverRedTint = "enabled:hover:bg-red-500/10";
export const colourControlSurface = `${colourBorderControl} ${colourFillControl}`;
export const colourPopoverSurface = `${colourFillPanel} ${colourDivider}`;
export const colourPageBackground = "bg-slate-950";
export const colourControlSurfaceDisabled = `${colourDivider} bg-slate-800/50`;
export const colourControlDividerDisabled = colourFillRaised;
export const colourControlShadow = "shadow-lg shadow-black/40";
export const colourSplashRule = "border-slate-800";
export const colourEditOverrideSurface = `border-amber-400 ${colourFillAmberFaint}`;
export const colourOverlayBackdrop = "bg-slate-950/60";
export const colourDrawerBackdrop = "bg-black/50";
export const colourModalBackdrop = "backdrop:bg-black/70";
export const colourModalBackdropSuspended = "backdrop:bg-transparent";
export const colourRequiredText = colourErrorText;
export const colourDivideList = "divide-slate-700";
export const colourAccentBar = "border-red-700";
export const colourControlRaised = `${colourBorderControl} ${colourFillRaised}`;
export const colourStateRed = `${colourBorderRed} bg-red-500/20`;
export const colourAdvanceFilled = `bg-red-700 ${colourBorderRed}`;
export const colourAdvanceEmpty = `${colourFillPanel} ${colourBorderControl}`;
export const colourFillInset = "bg-slate-800/60";
export const colourFillSelected = "bg-slate-800/70";
export const colourFillHeader = "bg-slate-900/80";
export const colourFillFloating = "bg-slate-900/90";
export const colourModalSurface = `${colourFillPanel} ${colourBorderSurface}`;
export const colourTabTrackSurface = `${colourBorderControl} bg-slate-950/70`;
export const colourTimelineMarker = "bg-slate-100";
export const colourQrBackground = "bg-white";
export const colourDotLoaded = "bg-green-400";
export const colourDotIdle = colourControlDivider;
export const colourIconMuted = colourTextMuted;
export const colourTextPlaceholder = "text-slate-500";
export const colourHoverSurface = "hover:bg-slate-800";
export const colourHoverRaised = "hover:bg-slate-600";
export const colourHoverTextPrimary = "hover:text-slate-200";
export const colourHoverTextBody = "hover:text-slate-300";
export const colourEnabledHoverTextBody = "enabled:hover:text-slate-300";
export const colourGroupHoverTextStrong = "group-hover:text-white";
export const colourHoverAccentTint = "hover:bg-red-500/10";
export const colourHoverToastControl = "hover:bg-white/10";
export const colourHoverLoadedDot = "hover:bg-green-500";
export const colourTextGMNote = "text-amber-400/70";
export const colourCustomEntryText = "text-fuchsia-400";
export const colourNavigationActiveText = colourHeadingAccent;
export const colourNoticeAmberTitle = "text-amber-200";
export const colourNoticeAmberText = "text-amber-100/80";
export const colourAmberFill = "bg-amber-500 text-slate-900";
export const colourOnAmberDim = "text-amber-900/70";
export const colourSplashTitle = "text-red-600";
export const colourTerminalText = chipTextColours.rose;
export const colourPsychicText = chipTextColours.indigo;
export const colourDrugNoticeText = "text-violet-400";
export const colourToggleSelectedViolet = `border-violet-400 bg-violet-600/80 ${colourTextOnFill} shadow-sm shadow-violet-950/50`;
export const colourToggleSelectedFuchsia = `border-fuchsia-400 bg-fuchsia-600/80 ${colourTextOnFill} shadow-sm shadow-fuchsia-950/50`;
export const colourToggleUnselected = `${colourControlSurface} ${colourTextMuted}`;
export const colourToggleUnselectedHover = `hover:border-slate-500 ${colourHoverTextBody}`;
export const colourAdvanceHover = "hover:border-red-600 hover:bg-red-900/60";
export const colourPickerCustomAction = `border-red-500/70 bg-red-950/20 ${colourErrorText} enabled:hover:border-red-400 enabled:hover:bg-red-950/35 enabled:hover:text-red-300`;
export const colourPickerSelected = "!bg-slate-800";
export const colourSegmentedTabInactive = `border-transparent ${colourTextMuted} ${colourHoverSurface} ${colourHoverTextPrimary}`;

export const colourEnabledHoverFuchsiaTint = "enabled:hover:bg-fuchsia-500/10";
export const colourEnabledHoverEmeraldTint = "enabled:hover:bg-emerald-500/10";
export const colourEnabledHoverSlateSurface = "enabled:hover:bg-slate-800";

export const colourButtonPrimary = `border ${colourBorderRed} ${colourHeadingAccent} ${colourEnabledHoverRedTint}`;
export const colourButtonSecondary = `border border-transparent ${colourFillRaised} ${colourTextBody} enabled:hover:bg-slate-600`;
export const colourButtonGhost = `border ${colourBorderControl} ${colourTextMuted} ${colourEnabledHoverSlateSurface}`;
export const colourButtonDangerGhost = `border border-transparent bg-red-900/40 ${colourErrorText} enabled:hover:bg-red-900/70`;
export const colourButtonWarningOutline = `border ${colourBorderAmber} text-amber-500 enabled:hover:bg-amber-500/10`;
export const colourButtonWarningGhost =
  "border border-transparent bg-amber-900/40 text-amber-400 enabled:hover:bg-amber-900/70";
export const colourButtonSuccessOutline = `border border-emerald-500 text-emerald-500 ${colourEnabledHoverEmeraldTint}`;

/** Text colour of a track step in the Insanity and Corruption steppers, by how far along the track it is. */
export const degreeTextColour = {
  first: "text-sky-200",
  second: colourNoticeAmberTitle,
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
  error: `${colourStateRed} text-red-100`,
  warning: `bg-amber-500/20 ${colourBorderAmber} text-amber-100`,
  info: "bg-blue-500/20 border-blue-500 text-blue-100",
} as const;
export const colourCareerPathOutline = `border ${colourBorderFuchsia} text-fuchsia-500 ${colourEnabledHoverFuchsiaTint}`;
export const colourCareerPathOutlineMuted = `border ${colourBorderFuchsiaSoft} text-fuchsia-300/60 enabled:hover:border-fuchsia-500/70 enabled:hover:bg-fuchsia-500/5 enabled:hover:text-fuchsia-300/80`;
export const colourCareerBranchOutline = colourButtonSuccessOutline;
export const colourCareerBranchOutlineMuted = `border ${colourBorderEmeraldSoft} text-emerald-300/60 enabled:hover:border-emerald-500/70 enabled:hover:bg-emerald-500/5 enabled:hover:text-emerald-300/80`;
export const colourButtonNeutralOutline = `border ${colourBorderSurface} ${colourTextPrimary} ${colourEnabledHoverSlateSurface}`;
export const colourActiveSky = `border-sky-400 bg-sky-600/80 ${colourTextOnFill} shadow-sm shadow-sky-950/50`;
export const colourActiveRose = `border-rose-400 bg-rose-600/80 ${colourTextOnFill} shadow-sm shadow-rose-950/50`;
export const colourActiveOrange = `border-orange-400 bg-orange-600/80 ${colourTextOnFill} shadow-sm shadow-orange-950/50`;
export const colourActiveEmerald = `border-emerald-400 bg-emerald-600/80 ${colourTextOnFill} shadow-sm shadow-emerald-950/50`;
export const colourButtonOutlineOrange =
  "!border-orange-500 !text-orange-500 enabled:hover:!bg-orange-500/10";
export const colourButtonOutlineCyan =
  "!border-cyan-500 !text-cyan-500 enabled:hover:!bg-cyan-500/10";
export const colourNoticeAmber = `${colourBorderAmberGlow} bg-amber-900/10`;
export const colourNoticePink = "border-pink-500/60 bg-pink-900/10";
export const colourNoticeViolet = `${colourBorderVioletGlow} bg-violet-900/10`;
export const colourNoticeRed = "border-red-500/60 bg-red-900/10";

export const chipColours = {
  slate: `border-slate-500/50 bg-slate-500/10 ${chipTextColours.slate}`,
  red: `border-red-500/50 bg-red-500/10 ${chipTextColours.red}`,
  amber: `border-amber-500/50 ${colourFillAmberFaint} ${chipTextColours.amber}`,
  yellow: `border-yellow-500/50 bg-yellow-500/10 ${chipTextColours.yellow}`,
  lime: `border-lime-500/50 bg-lime-500/10 ${chipTextColours.lime}`,
  green: `border-green-500/50 bg-green-500/10 ${chipTextColours.green}`,
  emerald: `${colourBorderEmeraldSoft} bg-emerald-500/10 ${chipTextColours.emerald}`,
  teal: `border-teal-500/50 bg-teal-500/10 ${chipTextColours.teal}`,
  cyan: `border-cyan-500/50 bg-cyan-500/10 ${chipTextColours.cyan}`,
  sky: `border-sky-500/50 bg-sky-500/10 ${chipTextColours.sky}`,
  blue: `border-blue-500/50 bg-blue-500/10 ${chipTextColours.blue}`,
  indigo: `border-indigo-500/50 bg-indigo-500/10 ${chipTextColours.indigo}`,
  violet: `border-violet-500/50 bg-violet-500/10 ${chipTextColours.violet}`,
  purple: `border-purple-500/50 bg-purple-500/10 ${chipTextColours.purple}`,
  fuchsia: `${colourBorderFuchsiaSoft} bg-fuchsia-500/10 ${chipTextColours.fuchsia}`,
  pink: `border-pink-500/50 bg-pink-500/10 ${chipTextColours.pink}`,
  rose: `border-rose-500/50 bg-rose-500/10 ${chipTextColours.rose}`,
  orange: `border-orange-500/50 bg-orange-500/10 ${chipTextColours.orange}`,
} as const;

export type ChipColour = keyof typeof chipColours;
/** Glowing pill look when owned or selected, one entry per colour. */
export const colourGlowActive = {
  teal: `border-teal-500/60 bg-teal-950/50 ${chipTextColours.teal} font-semibold`,
  violet: `${colourBorderVioletGlow} bg-violet-950/50 ${chipTextColours.violet} font-semibold`,
  orange: `border-orange-500/60 bg-orange-950/50 ${chipTextColours.orange} font-semibold`,
  sky: `border-sky-500/60 bg-sky-950/50 ${chipTextColours.sky} font-semibold`,
  amber: `${colourBorderAmberGlow} bg-amber-950/50 ${chipTextColours.amber} font-semibold`,
  emerald: `border-emerald-500/60 bg-emerald-950/50 ${chipTextColours.emerald} font-semibold`,
  cyan: `border-cyan-500/60 bg-cyan-950/50 ${chipTextColours.cyan} font-semibold`,
  fuchsia: `border-fuchsia-500/60 bg-fuchsia-950/50 ${chipTextColours.fuchsia} font-semibold`,
  indigo: `border-indigo-500/60 bg-indigo-950/50 ${chipTextColours.indigo} font-semibold`,
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

/** Selected look of a pick-one button: the chip look of its colour in semi-bold text. */
export const colourToggleSelected = Object.fromEntries(
  Object.entries(chipColours).map(([name, look]) => [name, `${look} font-semibold`])
) as Record<ChipColour, string>;
