// src/ui/buttons/CardOverlayButton.tsx
// The button stretched over a tappable card's header, so the whole header opens, expands, or chooses
// while the buttons inside it still work. This button owns the hover tint, and its peer title uses
// `uiOverlayItemNameHover` so nested controls do not highlight the card.

import type { ButtonHTMLAttributes } from "react";
import {
  uiDisabledControl,
  uiFocusRingInset,
  uiHoverSurface,
  uiPressFeedback,
} from "../styles/buttonStyles";
import { usePendingClick } from "../usePendingClick";
import { uiCorner } from "../styles/shapeStyles";

type CardOverlayButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "aria-expanded" | "className" | "type" | "children"
> & {
  label: string;
  /** Expanded state for a card that expands; leave it out for a card that chooses. */
  expanded?: boolean;
  /** Blocks taps and shows the waiting cursor while the card's action is saving. A click handler that returns a promise does this by itself until it settles. */
  pending?: boolean;
};

export function CardOverlayButton({
  label,
  expanded,
  pending: pendingProp = false,
  disabled,
  onClick,
  ...rest
}: CardOverlayButtonProps) {
  const { pending: clickPending, handleClick } = usePendingClick(onClick);
  const pending = pendingProp || clickPending;
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      className={`peer absolute inset-0 w-full ${uiCorner} ${uiHoverSurface} transition ${uiFocusRingInset} ${uiPressFeedback(
        !disabled && !pending
      )} ${pending ? "cursor-wait" : uiDisabledControl}`.trim()}
      onClick={handleClick}
      {...rest}
    />
  );
}
