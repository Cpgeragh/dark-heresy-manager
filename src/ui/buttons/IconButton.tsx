// src/ui/buttons/IconButton.tsx
// Shared base for the icon-only buttons (Add, Archive, Disconnect, Edit, Manage Devices, Remove,
// Unlink, View). Each of those supplies its own icon; this owns the styling, the loading spinner
// and the blocked clicks while loading.

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { uiIconButton, uiIconButtonCompact, uiIconButtonIconSize } from "../styles/buttonStyles";
import { uiSpinner } from "../styles/editableStyles";

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
  /** Compact size for controls inside cards. */
  size?: "md" | "sm";
  /** Shows a spinner in place of the icon and blocks clicks while the action is in progress. */
  loading?: boolean;
};

export function IconButton({
  label,
  size = "md",
  loading = false,
  className = "",
  disabled,
  icon,
  ...buttonProps
}: IconButtonProps & { icon: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`${size === "sm" ? uiIconButtonCompact : uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      {loading ? (
        <span className={`${uiSpinner} ${uiIconButtonIconSize[size]}`} aria-hidden="true" />
      ) : (
        icon
      )}
    </button>
  );
}
