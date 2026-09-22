import type { ButtonHTMLAttributes } from "react";
import { DevicesIcon } from "../icons/DevicesIcon";
import { uiIconButton } from "../styles/buttonStyles";

type ManageDevicesButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function ManageDevicesButton({
  label,
  className = "",
  ...buttonProps
}: ManageDevicesButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconButton} ${className}`.trim()}
      {...buttonProps}
    >
      <DevicesIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
