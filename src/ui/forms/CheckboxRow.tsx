import type { ReactNode } from "react";
import { colourInputAccent } from "../styles/colourTokens";
import { uiTextBody } from "../styles/editableStyles";
import { RequiredMark } from "./RequiredMark";

interface CheckboxRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  /** Extra classes for the row, such as centring. */
  className?: string;
  children: ReactNode;
}

/** A tick box with its sentence: the one checkbox row used by every confirmation and option. */
export function CheckboxRow({
  checked,
  onChange,
  disabled = false,
  required = false,
  className = "",
  children,
}: CheckboxRowProps) {
  return (
    <label
      className={`flex items-start gap-3 text-sm lg:text-base ${uiTextBody} ${
        disabled ? "" : "cursor-pointer"
      } ${className}`.trim()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.checked)}
        className={`mt-0.5 h-4 w-4 shrink-0 lg:mt-1 ${colourInputAccent}`}
      />
      <span>
        {children}
        {required && (
          <>
            {" "}
            <RequiredMark />
          </>
        )}
      </span>
    </label>
  );
}
