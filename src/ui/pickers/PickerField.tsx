import type { ReactNode } from "react";
import { editableInputClass, uiFormLabel } from "../styles/editableStyles";
import { ArrowRight } from "../icons/PickerArrows";
import { RequiredFormLabel } from "../forms/RequiredFormLabel";
import { uiPickerPressFeedback } from "../styles/buttonStyles";

interface SharedPickerFieldProps {
  id: string;
  value?: string;
  placeholder: string;
  onClick: () => void;
  required?: boolean;
  supportingText?: ReactNode;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

type PickerFieldProps = SharedPickerFieldProps &
  (
    | {
        label: ReactNode;
        ariaLabel?: never;
      }
    | {
        label?: never;
        ariaLabel: string;
      }
  );

/** Field-like button that opens an OptionPickerScreen. */
export function PickerField({
  id,
  label,
  ariaLabel,
  value = "",
  placeholder,
  onClick,
  required = false,
  supportingText,
  disabled = false,
  className = "",
  buttonClassName = "",
}: PickerFieldProps) {
  return (
    <div className={className}>
      {label &&
        (required ? (
          <RequiredFormLabel htmlFor={id} supportingText={supportingText}>
            {label}
          </RequiredFormLabel>
        ) : (
          <label htmlFor={id} className={uiFormLabel}>
            {label}
            {supportingText && (
              <span className="ml-1 normal-case tracking-normal text-slate-500">
                {supportingText}
              </span>
            )}
          </label>
        ))}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        aria-haspopup="dialog"
        aria-required={required || undefined}
        onClick={onClick}
        className={`${editableInputClass(!disabled)} ${
          label ? "mt-0.5" : ""
        } appearance-none text-left flex items-center justify-between ${uiPickerPressFeedback(!disabled)} ${buttonClassName}`.trim()}
      >
        <span className={value ? "" : "text-slate-500"}>
          {value || placeholder}
        </span>
        <ArrowRight />
      </button>
    </div>
  );
}
