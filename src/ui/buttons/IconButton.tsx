// src/ui/buttons/IconButton.tsx
// Shared base for the icon-only buttons (Add, Archive, Disconnect, Edit, Manage Devices, Remove,
// Unlink, View). Each of those supplies its own icon; this owns the styling, the loading spinner
// and the blocked clicks while loading.

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import {
  uiDisabledControl,
  uiIconButton,
  uiIconButtonCompact,
  uiIconButtonIconSize,
  uiPressFeedback,
} from "../styles/buttonStyles";
import { uiSpinner } from "../styles/editableStyles";
import { usePendingClick } from "../usePendingClick";

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type" | "onClick"
> & {
  label: string;
  /** Compact size for controls inside cards. */
  size?: "md" | "sm";
  /** Shows a spinner in place of the icon and blocks clicks while the action is in progress. */
  loading?: boolean;
  /** A handler that returns a promise keeps the button in its loading state until it settles. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
};

export function IconButton({
  label,
  size = "md",
  loading = false,
  className = "",
  disabled,
  icon,
  onClick,
  ...buttonProps
}: IconButtonProps & { icon: ReactNode }) {
  const { pending, handleClick } = usePendingClick(onClick);
  const busy = loading || pending;

  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      className={`${size === "sm" ? uiIconButtonCompact : uiIconButton} ${
        busy ? "cursor-wait" : uiDisabledControl
      } ${uiPressFeedback(!disabled && !busy)} ${className}`.trim()}
      onClick={handleClick}
      {...buttonProps}
    >
      {busy ? (
        <span className={`${uiSpinner} ${uiIconButtonIconSize[size]}`} aria-hidden="true" />
      ) : (
        icon
      )}
    </button>
  );
}
