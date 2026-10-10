// src/ui/buttons/CardOverlayButton.tsx
// The invisible button stretched over a tappable card's header, so the whole header opens, expands
// or chooses while the buttons inside it still work. The header carries `uiCardTapHeader` for the
// hover tint, and its title carries `uiCardTitleHover` or `uiItemNameHover`.

import type { ButtonHTMLAttributes } from "react";
import { uiDisabledControl, uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";

type CardOverlayButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "aria-expanded" | "className" | "type" | "children"
> & {
  label: string;
  /** Expanded state for a card that expands; leave it out for a card that chooses. */
  expanded?: boolean;
  /** Blocks taps and shows the waiting cursor while the card's action is saving. */
  pending?: boolean;
};

export function CardOverlayButton({
  label,
  expanded,
  pending = false,
  disabled,
  ...rest
}: CardOverlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      className={`absolute inset-0 w-full rounded focus-visible:ring-inset ${uiFocusRing} ${uiPressFeedback(
        !disabled && !pending
      )} ${pending ? "cursor-wait" : uiDisabledControl}`.trim()}
      {...rest}
    />
  );
}
