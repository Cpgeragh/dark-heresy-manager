// src/ui/styles/buttonStyles.ts

import {
  colourControlRaised,
  colourCustomEntryText,
  colourFillRaised,
  colourHeadingAccent,
  colourTextBody,
  colourTextMuted,
  colourTextPlaceholder,
} from "./colourTokens";

const PICKER_PRESS_FEEDBACK =
  "active:scale-[0.99] active:!border-red-400 active:!bg-slate-700 active:ring-1 active:ring-red-400/70";

/** Shared phone press feedback for every interactive picker surface. */
export function uiPickerPressFeedback(interactive = true): string {
  return interactive ? PICKER_PRESS_FEEDBACK : "";
}

/** Slight shrink while an enabled button is pressed, switched off for reduced motion. */
export const uiButtonPressShrink =
  "enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100";

/** Hover and press feedback for a card that is one big link: the neutral button's slate fill and shrink. */
export const uiCardLinkFeedback =
  "hover:bg-slate-800 active:scale-[0.98] active:bg-slate-700/75 motion-reduce:active:scale-100 transition";

/** The same feedback for a card whose link is an overlay, so the card reacts to the link under it. */
export const uiCardOverlayLinkFeedback =
  "has-[a:hover]:bg-slate-800 has-[a:active]:scale-[0.98] has-[a:active]:bg-slate-700/75 motion-reduce:has-[a:active]:scale-100 transition";

export const uiDismissButton = `${colourTextMuted} hover:text-slate-200 text-lg leading-none`;

/** A small control that shows information, such as the info button and the tooltip button. */
export const uiInfoButton = `rounded border ${colourControlRaised} ${colourTextBody} hover:bg-slate-600`;

/** The fill and hover of a plus or minus button on a counter or a quantity editor. */
export const uiStepButtonColour = `${colourFillRaised} hover:bg-slate-600 ${colourTextBody}`;

/** The same plus or minus button when the counter cannot be edited. */
export const uiStepButtonDisabled = `bg-black/10 ${colourTextPlaceholder} cursor-not-allowed`;

/** An underlined text link that is really a button, such as Reveal. */
export const uiTextButton = "underline hover:text-slate-300 disabled:opacity-50";

export const uiExpandButton = "flex-1 min-w-0 text-left";

/** Header of a tappable card: the hover tint, and the group its title turns white with. */
export const uiCardTapHeader = "group transition hover:bg-slate-700/40";

/** Icon size inside an icon button, matched to the button's own size. */
export const uiIconButtonIconSize = { md: "w-[18px] h-[18px]", sm: "w-4 h-4" } as const;

export const uiIconButtonCompact = `inline-flex items-center justify-center rounded-lg border border-red-500 ${colourHeadingAccent} enabled:hover:bg-red-500/10 enabled:active:bg-red-500/20 ${uiButtonPressShrink} transition p-1 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed`;

export const uiIconButton = `inline-flex items-center justify-center rounded-lg border border-red-500 ${colourHeadingAccent} enabled:hover:bg-red-500/10 enabled:active:bg-red-500/20 ${uiButtonPressShrink} transition p-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed`;

/** Same shape as uiIconButton, fuchsia instead of red, for a DM's off-catalog custom-entry action. */
export const uiIconButtonCustom = `inline-flex items-center justify-center rounded-lg border border-fuchsia-500 ${colourCustomEntryText} enabled:hover:bg-fuchsia-500/10 enabled:active:bg-fuchsia-500/20 ${uiButtonPressShrink} transition p-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 disabled:cursor-not-allowed`;
