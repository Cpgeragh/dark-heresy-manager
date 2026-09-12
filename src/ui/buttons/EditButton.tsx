import type { ButtonHTMLAttributes } from "react";
import { uiIconAddButton } from "../styles/buttonStyles";
import { PencilIcon } from "../icons/PencilIcon";

type EditButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "type"
> & {
  label: string;
};

export function EditButton({ label, className = "", ...buttonProps }: EditButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${uiIconAddButton} ${className}`.trim()}
      {...buttonProps}
    >
      <PencilIcon className="w-[18px] h-[18px]" />
    </button>
  );
}
