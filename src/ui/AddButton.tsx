// src/ui/AddButton.tsx
import type { ButtonHTMLAttributes } from "react";
import { uiIconAddButton, uiIconRemoveButton } from "./buttonStyles";
import { PlusIcon } from "./PlusIcon";

type AddButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
  /** "sm" matches RemoveButton's size — use inside cards, beside a plain (non-red-header) label. */
  size?: "md" | "sm";
};

export function AddButton({ label, size = "md", className = "", ...buttonProps }: AddButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${size === "sm" ? uiIconRemoveButton : uiIconAddButton} ${className}`.trim()}
      {...buttonProps}
    >
      <PlusIcon className={size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]"} />
    </button>
  );
}
