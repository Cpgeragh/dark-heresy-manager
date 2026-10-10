// src/ui/styles/buttonStyles.ts

import {
  colourControlRaised,
  colourCustomEntryText,
  colourEnabledHoverFuchsiaTint,
  colourEnabledHoverRedTint,
  colourEnabledHoverTextBody,
  colourFillRaised,
  colourHeadingAccent,
  colourHoverRaised,
  colourHoverSurface,
  colourHoverTextPrimary,
  colourTextBody,
  colourTextMuted,
  colourTextPlaceholder,
} from "./colourTokens";

const PRESS_FEEDBACK = "active:scale-[0.98] motion-reduce:active:scale-100";

/** Shared press feedback for every interactive control. */
export function uiPressFeedback(interactive = true): string {
  return interactive ? PRESS_FEEDBACK : "";
}

export { colourHoverSurface as uiHoverSurface };

export const uiFocusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

export const uiFocusWithinRing =
  "focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500";

export const uiDisabledControl = "disabled:cursor-not-allowed disabled:opacity-50";

export const uiDisabledLook = "cursor-not-allowed opacity-50";

/** Hover and press feedback for a card that is one big link: the neutral button's slate fill and shrink. */
export const uiCardLinkFeedback = `${colourHoverSurface} ${uiPressFeedback()} ${uiFocusRing} transition`;

/** The same feedback for a card whose link is an overlay, so the card reacts to the link under it. */
export const uiCardOverlayLinkFeedback =
  "has-[a:hover]:bg-slate-800 has-[a:active]:scale-[0.98] motion-reduce:has-[a:active]:scale-100 transition";

export const uiDismissButton = `${colourTextMuted} ${colourHoverTextPrimary} text-lg leading-none ${uiPressFeedback()} ${uiFocusRing}`;

/** A small control that shows information, such as the info button and the tooltip button. */
export const uiInfoButton = `rounded border ${colourControlRaised} ${colourTextBody} ${colourHoverRaised} ${uiPressFeedback()} ${uiFocusRing}`;

/** The fill and hover of a plus or minus button on a counter or a quantity editor. */
export const uiStepButtonColour = `${colourFillRaised} ${colourHoverRaised} ${colourTextBody} ${uiPressFeedback()} ${uiFocusRing}`;

/** The same plus or minus button when the counter cannot be edited. */
export const uiStepButtonDisabled = `bg-black/10 ${colourTextPlaceholder} ${uiDisabledLook}`;

/** An underlined text link that is really a button, such as Reveal. */
export const uiTextButton = `underline ${colourEnabledHoverTextBody} ${uiPressFeedback()} ${uiFocusRing} ${uiDisabledControl}`;

export function uiChipButtonState(interactive = true): string {
  return `transition ${interactive ? "hover:opacity-80" : ""} ${uiFocusRing} ${uiDisabledControl}`;
}

export const uiEditableValueHover = `${colourHoverTextPrimary} hover:underline decoration-slate-500 decoration-dotted underline-offset-2`;

export const uiExpandButton = "flex-1 min-w-0 text-left";

/** Header of a tappable card: the hover tint, and the group its title turns white with. */
export const uiCardTapHeader = `group transition ${colourHoverSurface}`;

/** Icon size inside an icon button, matched to the button's own size. */
export const uiIconButtonIconSize = { md: "w-[18px] h-[18px]", sm: "w-4 h-4" } as const;

const uiIconButtonBase = `inline-flex items-center justify-center rounded-lg border border-red-500 ${colourHeadingAccent} ${colourEnabledHoverRedTint} transition shrink-0 ${uiFocusRing}`;

export const uiIconButtonCompact = `${uiIconButtonBase} p-1`;

export const uiIconButton = `${uiIconButtonBase} p-1.5`;

/** Same shape as uiIconButton, fuchsia instead of red, for a DM's off-catalog custom-entry action. */
export const uiIconButtonCustom = `inline-flex items-center justify-center rounded-lg border border-fuchsia-500 ${colourCustomEntryText} ${colourEnabledHoverFuchsiaTint} ${uiPressFeedback()} transition p-1.5 shrink-0 ${uiFocusRing}`;
