import type { ButtonHTMLAttributes } from "react";
import { uiIconRemoveButton } from "../styles/buttonStyles";
import { TrashIcon } from "../icons/TrashIcon";

type RemoveButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function RemoveButton({ label, className = "", ...buttonProps }: RemoveButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconRemoveButton} ${className}`.trim()}
      {...buttonProps}
    >
      <TrashIcon />
    </button>
  );
}
