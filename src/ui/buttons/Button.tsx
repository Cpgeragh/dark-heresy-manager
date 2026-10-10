// src/ui/buttons/Button.tsx
// Shared action button. Standardises variant, size, radius, focus, press feedback, and disabled
// and loading styling so the standalone action buttons across the app stay consistent.
//
// NOT for: icon buttons, toggle chips, tab buttons, steppers/quantity controls,
// picker rows, or expandable card headers; those are their own components.

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import {
  colourButtonDanger,
  colourButtonDangerGhost,
  colourButtonGhost,
  colourButtonNeutralOutline,
  colourButtonPrimary,
  colourButtonSecondary,
  colourButtonSuccess,
  colourButtonSuccessOutline,
  colourButtonWarning,
  colourButtonWarningGhost,
  colourButtonWarningOutline,
  colourCareerBranchOutline,
  colourCareerBranchOutlineMuted,
  colourCareerPathOutline,
  colourCareerPathOutlineMuted,
} from "../styles/colourTokens";
import { uiDisabledControl, uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";
import { LoadingDots } from "../LoadingDots";
import { usePendingClick } from "../usePendingClick";

export type ButtonVariant =
  | "primary"
  | "careerPath"
  | "careerPathMuted"
  | "careerBranch"
  | "careerBranchMuted"
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

const VARIANTS: Record<ButtonVariant, string> = {
  primary: colourButtonPrimary,
  careerPath: colourCareerPathOutline,
  careerPathMuted: colourCareerPathOutlineMuted,
  careerBranch: colourCareerBranchOutline,
  careerBranchMuted: colourCareerBranchOutlineMuted,
  secondary: colourButtonSecondary,
  ghost: colourButtonGhost,
  neutral: colourButtonNeutralOutline,
  danger: colourButtonDanger,
  dangerGhost: colourButtonDangerGhost,
  warning: colourButtonWarning,
  warningOutline: colourButtonWarningOutline,
  warningGhost: colourButtonWarningGhost,
  success: colourButtonSuccess,
  successOutline: colourButtonSuccessOutline,
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
        busy ? "cursor-wait" : uiDisabledControl,
        uiPressFeedback(!disabled && !busy),
        uiFocusRing,
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
