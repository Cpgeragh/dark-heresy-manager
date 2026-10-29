// src/ui/styles/buttonStyles.ts

import {
  colourBorderFuchsia,
  colourBorderRed,
  colourControlRaised,
  colourCustomEntryText,
  colourEnabledHoverFuchsiaTint,
  colourEnabledHoverRedTint,
  colourEnabledHoverSlateSurface,
  colourEnabledHoverTextBody,
  colourFillRaised,
  colourHeadingAccent,
  colourHoverRaised,
  colourHoverSurface,
  colourHoverTextPrimary,
  colourOverlayHoverSurface,
  colourTextBody,
  colourTextMuted,
  colourTextPlaceholder,
} from "./colourTokens";
import { uiCorner, uiCornerSmall } from "./shapeStyles";

const PRESS_FEEDBACK = "active:scale-press motion-reduce:active:scale-100";

/** Shared press feedback for every interactive control. */
export function uiPressFeedback(interactive = true): string {
  return interactive ? PRESS_FEEDBACK : "";
}

export { colourHoverSurface as uiHoverSurface };

export const uiFocusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

/** The same ring drawn inside the element, for a control stretched over a card. */
export const uiFocusRingInset = `${uiFocusRing} focus-visible:ring-inset`;

export const uiFocusWithinRing =
  "focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500";

export const uiDisabledControl = "disabled:cursor-not-allowed disabled:opacity-50";

export const uiDisabledLook = "cursor-not-allowed opacity-50";

/** Hover and press feedback for a card that is one big link: the neutral button's slate fill and shrink. */
export const uiCardLinkFeedback = `${colourHoverSurface} ${uiPressFeedback()} ${uiFocusRing} transition`;

/** The same feedback for a card whose link is an overlay, so the card reacts to the link under it. */
export const uiCardOverlayLinkFeedback = `${colourOverlayHoverSurface} has-[a:active]:scale-press motion-reduce:has-[a:active]:scale-100 transition`;

export const uiDismissButton = `${colourTextMuted} ${colourHoverTextPrimary} text-lg leading-none transition ${uiPressFeedback()} ${uiFocusRing}`;

/** The three responsive sizes of a button for an action on an owned entry, taller from 640 px and larger from 768 px. */
export const uiEntryActionSize = "sm:h-7 sm:px-2.5 md:h-8 md:px-3 md:text-sm";

/** A small control that shows information, such as the info button and the tooltip button. */
export const uiInfoButton = `${uiCornerSmall} border ${colourControlRaised} ${colourTextBody} ${colourHoverRaised} transition ${uiPressFeedback()} ${uiFocusRing}`;

/** The fill and hover of a plus or minus button on a counter or a quantity editor. */
export const uiStepButtonColour = `${colourFillRaised} ${colourHoverRaised} ${colourTextBody} transition ${uiPressFeedback()} ${uiFocusRing}`;

/** The same plus or minus button when the counter cannot be edited. */
export const uiStepButtonDisabled = `bg-black/10 ${colourTextPlaceholder} ${uiDisabledLook}`;

/** An underlined text link that is really a button, such as Reveal. */
export const uiTextButton = `underline ${colourEnabledHoverTextBody} transition ${uiPressFeedback()} ${uiFocusRing} ${uiDisabledControl}`;

/** The dimming hover of a chip or coloured text button. */
export const uiOpacityHover = "hover:opacity-80";

/** Hover and press feedback for a button that looks like a text box, such as a picker field. */
export function uiFieldButtonFeedback(interactive = true): string {
  return interactive ? `${colourEnabledHoverSlateSurface} ${uiPressFeedback()}` : "";
}

export function uiChipButtonState(interactive = true): string {
  return `transition ${interactive ? uiOpacityHover : ""} ${uiFocusRing} ${uiDisabledControl}`;
}

export const uiEditableValueHover = `${colourHoverTextPrimary} hover:underline decoration-slate-500 decoration-dotted underline-offset-2`;

/** Header of a tappable card whose hover feedback belongs to its overlay button. */
export const uiCardTapHeader = "transition";

/** Icon size inside an icon button, matched to the button's own size. */
export const uiIconButtonIconSize = { md: "w-[18px] h-[18px]", sm: "w-4 h-4" } as const;

const uiIconButtonBase = `inline-flex items-center justify-center ${uiCorner} border ${colourBorderRed} ${colourHeadingAccent} ${colourEnabledHoverRedTint} transition shrink-0 ${uiFocusRing}`;

export const uiIconButtonCompact = `${uiIconButtonBase} p-1`;

export const uiIconButton = `${uiIconButtonBase} p-1.5`;

/** Same shape as uiIconButton, fuchsia instead of red, for a DM's off-catalog custom-entry action. */
export const uiIconButtonCustom = `inline-flex items-center justify-center ${uiCorner} border ${colourBorderFuchsia} ${colourCustomEntryText} ${colourEnabledHoverFuchsiaTint} ${uiPressFeedback()} transition p-1.5 shrink-0 ${uiFocusRing}`;
