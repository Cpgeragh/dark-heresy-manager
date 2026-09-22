import type { ButtonHTMLAttributes } from "react";
import { uiIconButton } from "../styles/buttonStyles";
import { UnlinkIcon } from "../icons/UnlinkIcon";

type UnlinkButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function UnlinkButton({ label, className = "", ...buttonProps }: UnlinkButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      <UnlinkIcon className="w-[18px] h-[18px]" />
    </button>
  );
}
