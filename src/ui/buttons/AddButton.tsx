// src/ui/buttons/AddButton.tsx
import type { ButtonHTMLAttributes } from "react";
import { uiIconButton, uiIconButtonCompact } from "../styles/buttonStyles";
import { PlusIcon } from "../icons/PlusIcon";

type AddButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
  /** Compact size for controls inside cards. */
  size?: "md" | "sm";
};

export function AddButton({ label, size = "md", className = "", ...buttonProps }: AddButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${size === "sm" ? uiIconButtonCompact : uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      <PlusIcon className={size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]"} />
    </button>
  );
}
