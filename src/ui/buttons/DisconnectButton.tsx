import type { ButtonHTMLAttributes } from "react";
import { uiIconButton } from "../styles/buttonStyles";
import { UnlinkIcon } from "../icons/UnlinkIcon";

type DisconnectButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function DisconnectButton({ label, className = "", ...buttonProps }: DisconnectButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      <UnlinkIcon />
    </button>
  );
}
