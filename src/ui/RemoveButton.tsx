import type { ButtonHTMLAttributes } from "react";
import { uiIconRemoveButton } from "./buttonStyles";
import { TrashIcon } from "./TrashIcon";

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
