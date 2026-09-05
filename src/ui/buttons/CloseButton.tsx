// Shared close control for modals, drawers, and other dismissible surfaces.
// Back navigation and destructive removal controls remain separate.

import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

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
  ...props
}: CloseButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg lg:text-xl text-slate-400 hover:text-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${className}`.trim()}
      {...props}
    >
      <CloseIcon />
    </button>
  );
}
