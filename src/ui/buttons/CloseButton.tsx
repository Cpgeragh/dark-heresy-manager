// Shared close control for modals, drawers, and other dismissible surfaces.
// Back navigation and destructive removal controls remain separate.

import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { colourHoverTextPrimary, colourTextMuted } from "../styles/colourTokens";
import { uiDisabledControl, uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";

export type CloseIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function CloseIcon({ className = "", ...props }: CloseIconProps) {
  return (
    <span aria-hidden="true" className={`leading-none ${className}`.trim()} {...props}>
      ×
    </span>
  );
}

export type CloseButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  ariaLabel?: string;
};

export function CloseButton({
  ariaLabel = "Close",
  className = "",
  type = "button",
  disabled,
  ...props
}: CloseButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg lg:text-xl ${colourTextMuted} ${
        disabled ? "" : colourHoverTextPrimary
      } transition ${uiPressFeedback(!disabled)} ${uiFocusRing} ${uiDisabledControl} ${className}`.trim()}
      {...props}
    >
      <CloseIcon />
    </button>
  );
}
