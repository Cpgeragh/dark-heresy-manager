// src/ui/Button.tsx
// Shared action button. Standardizes variant, size, radius, focus, and disabled
// styling so the standalone action buttons across the app stay consistent.
//
// NOT for: icon buttons, toggle chips, tab buttons, steppers/quantity controls,
// or the tiny inline confirm micro-buttons — those are their own components.

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost" | "warningGhost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 border border-transparent",
  secondary: "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-transparent",
  ghost: "border border-slate-600 text-slate-400 hover:bg-slate-800",
  danger: "bg-red-700 text-white hover:bg-red-600 border border-transparent",
  dangerGhost: "bg-red-900/40 text-red-400 hover:bg-red-900/70 border border-transparent",
  warningGhost: "bg-amber-900/40 text-amber-400 hover:bg-amber-900/70 border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
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
