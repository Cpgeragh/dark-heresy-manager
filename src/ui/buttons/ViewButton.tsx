// src/ui/buttons/ViewButton.tsx
import type { ButtonHTMLAttributes } from "react";
import { uiIconButton, uiIconButtonCompact } from "../styles/buttonStyles";
import { EyeIcon } from "../icons/EyeIcon";

type ViewButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
  size?: "md" | "sm";
};

export function ViewButton({ label, size = "md", className = "", ...buttonProps }: ViewButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${size === "sm" ? uiIconButtonCompact : uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      <EyeIcon className={size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]"} />
    </button>
  );
}
