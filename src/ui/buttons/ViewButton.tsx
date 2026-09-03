// src/ui/buttons/ViewButton.tsx
import type { ButtonHTMLAttributes } from "react";
import { uiIconAddButton } from "../styles/buttonStyles";
import { EyeIcon } from "../icons/EyeIcon";

type ViewButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function ViewButton({ label, className = "", ...buttonProps }: ViewButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconAddButton} ${className}`.trim()}
      {...buttonProps}
    >
      <EyeIcon className="w-[18px] h-[18px]" />
    </button>
  );
}
