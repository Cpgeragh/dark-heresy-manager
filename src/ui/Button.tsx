// src/ui/Button.tsx
// Shared action button. Standardises variant, size, radius, focus, and disabled
// styling so the standalone action buttons across the app stay consistent.
//
// NOT for: icon buttons, toggle chips, tab buttons, steppers/quantity controls,
// picker rows, or expandable card headers — those are their own components.

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "warning"
  | "warningGhost"
  | "success";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-red-500 text-red-500 enabled:hover:bg-red-500/10",
  secondary: "border border-transparent bg-slate-700 text-slate-300 enabled:hover:bg-slate-600",
  ghost: "border border-slate-600 text-slate-400 enabled:hover:bg-slate-800",
  danger: "border border-transparent bg-red-700 text-white enabled:hover:bg-red-600",
  dangerGhost: "border border-transparent bg-red-900/40 text-red-400 enabled:hover:bg-red-900/70",
  warning: "border border-transparent bg-amber-600 text-slate-950 enabled:hover:bg-amber-500",
  warningGhost: "border border-transparent bg-amber-900/40 text-amber-400 enabled:hover:bg-amber-900/70",
  success: "border border-transparent bg-green-700 text-white enabled:hover:bg-green-600",
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
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
