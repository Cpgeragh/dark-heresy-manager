// src/ui/AddButton.tsx
import type { ButtonHTMLAttributes } from "react";
import { uiIconAddButton } from "./buttonStyles";
import { PlusIcon } from "./PlusIcon";

type AddButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function AddButton({ label, className = "", ...buttonProps }: AddButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconAddButton} ${className}`.trim()}
      {...buttonProps}
    >
      <PlusIcon className="w-[18px] h-[18px]" />
    </button>
  );
}
