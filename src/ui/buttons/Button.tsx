// src/ui/buttons/Button.tsx
// Shared action button. Standardises variant, size, radius, focus, press feedback, and disabled
// and loading styling so the standalone action buttons across the app stay consistent.
//
// NOT for: icon buttons, toggle chips, tab buttons, steppers/quantity controls,
// picker rows, or expandable card headers; those are their own components.

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import {
  colourButtonNeutralOutline,
  colourCareerPathOutline,
  colourCareerPathOutlineMuted,
} from "../styles/colourTokens";
import { uiButtonPressShrink } from "../styles/buttonStyles";
import { LoadingDots } from "../LoadingDots";
import { usePendingClick } from "../usePendingClick";

export type ButtonVariant =
  | "primary"
  | "careerPath"
  | "careerPathMuted"
  | "secondary"
  | "ghost"
  | "neutral"
  | "danger"
  | "dangerGhost"
  | "warning"
  | "warningOutline"
  | "warningGhost"
  | "success"
  | "successOutline";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows moving dots after the label at full brightness and blocks clicks while work is in progress. */
  loading?: boolean;
  /** Label shown with the dots while loading. Defaults to the normal label. */
  loadingLabel?: ReactNode;
  /** A handler that returns a promise keeps the button in its loading state until it settles. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
  children: ReactNode;
}

// Outline variants press to their own colour at twice the hover tint. Solid variants press one
// shade brighter than hover.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-red-500 text-red-500 enabled:hover:bg-red-500/10 enabled:active:bg-red-500/20",
  careerPath: colourCareerPathOutline,
  careerPathMuted: colourCareerPathOutlineMuted,
  secondary:
    "border border-transparent bg-slate-700 text-slate-300 enabled:hover:bg-slate-600 enabled:active:bg-slate-500",
  ghost:
    "border border-slate-600 text-slate-400 enabled:hover:bg-slate-800 enabled:active:bg-slate-700/75",
  neutral: colourButtonNeutralOutline,
  danger:
    "border border-transparent bg-red-700 text-white enabled:hover:bg-red-600 enabled:active:bg-red-500",
  dangerGhost:
    "border border-transparent bg-red-900/40 text-red-400 enabled:hover:bg-red-900/70 enabled:active:bg-red-900",
  warning:
    "border border-transparent bg-amber-600 text-slate-950 enabled:hover:bg-amber-500 enabled:active:bg-amber-400",
  warningOutline:
    "border border-amber-500 text-amber-400 enabled:hover:bg-amber-500/10 enabled:active:bg-amber-500/20",
  warningGhost:
    "border border-transparent bg-amber-900/40 text-amber-400 enabled:hover:bg-amber-900/70 enabled:active:bg-amber-900",
  success:
    "border border-transparent bg-green-700 text-white enabled:hover:bg-green-600 enabled:active:bg-green-500",
  successOutline:
    "border border-emerald-500 text-emerald-300 enabled:hover:bg-emerald-500/10 enabled:active:bg-emerald-500/20",
};

const SIZES: Record<ButtonSize, string> = {
  xs: "px-2 py-0.5 text-xs lg:text-sm",
  sm: "px-3 py-1 text-xs lg:px-4 lg:py-1.5 lg:text-sm",
  md: "px-4 py-2 text-sm lg:text-base",
  lg: "px-4 py-3 text-base lg:text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingLabel,
  type = "button",
  className = "",
  disabled,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const { pending, handleClick } = usePendingClick(onClick);
  const busy = loading || pending;

  return (
    <button
      type={type}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      className={[
        "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg font-semibold transition",
        "disabled:cursor-not-allowed",
        busy ? "" : "disabled:opacity-50",
        uiButtonPressShrink,
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      onClick={handleClick}
      {...rest}
    >
      {busy ? (
        <span>
          {loadingLabel ?? children}
          <LoadingDots />
        </span>
      ) : (
        children
      )}
    </button>
  );
}
