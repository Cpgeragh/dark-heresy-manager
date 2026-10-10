// src/ui/buttons/ToggleButton.tsx
// One button in a pick-one row, such as craftsmanship or a weapon profile. The unselected look and
// the behaviour are shared; the caller passes the selected colour and its own size classes.

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { colourToggleUnselected, colourToggleUnselectedHover } from "../styles/colourTokens";
import { uiDisabledControl, uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";

const TOGGLE_BASE = `rounded border transition ${uiFocusRing} ${uiDisabledControl}`;

const TOGGLE_UNSELECTED = colourToggleUnselected;

/** Classes for a pick-one button, for a caller that cannot use a button element, such as a radio label. */
export function toggleButtonClass(
  selected: boolean,
  selectedClassName: string,
  className = "",
  interactive = true
) {
  return [
    TOGGLE_BASE,
    selected
      ? selectedClassName
      : `${TOGGLE_UNSELECTED} ${interactive ? colourToggleUnselectedHover : ""}`,
    uiPressFeedback(interactive),
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

interface ToggleButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "type" | "aria-pressed"
> {
  selected: boolean;
  /** Colour classes shown while selected. */
  selectedClassName: string;
  /** Size and layout classes. */
  className?: string;
  children: ReactNode;
}

export function ToggleButton({
  selected,
  selectedClassName,
  className,
  children,
  disabled,
  ...rest
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={toggleButtonClass(selected, selectedClassName, className, !disabled)}
      {...rest}
    >
      {children}
    </button>
  );
}
