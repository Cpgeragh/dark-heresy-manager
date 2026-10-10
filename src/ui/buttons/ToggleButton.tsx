// src/ui/buttons/ToggleButton.tsx
// One button in a pick-one row, such as craftsmanship or a weapon profile. The unselected look and
// the behaviour are shared; the caller passes the selected colour and its own size classes.

import type { ButtonHTMLAttributes, ReactNode } from "react";

const TOGGLE_BASE =
  "rounded border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50";

const TOGGLE_UNSELECTED =
  "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300";

/** Classes for a pick-one button, for a caller that cannot use a button element, such as a radio label. */
export function toggleButtonClass(selected: boolean, selectedClassName: string, className = "") {
  return [TOGGLE_BASE, selected ? selectedClassName : TOGGLE_UNSELECTED, className]
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
  ...rest
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={toggleButtonClass(selected, selectedClassName, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
