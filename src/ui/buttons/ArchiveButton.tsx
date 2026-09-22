import type { ButtonHTMLAttributes } from "react";
import { uiIconButton } from "../styles/buttonStyles";
import { ArchiveIcon } from "../icons/ArchiveIcon";

type ArchiveButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function ArchiveButton({ label, className = "", ...buttonProps }: ArchiveButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      <ArchiveIcon className="w-[18px] h-[18px]" />
    </button>
  );
}
