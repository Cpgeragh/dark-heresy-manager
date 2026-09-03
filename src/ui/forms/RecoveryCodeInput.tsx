import { useId, type ReactNode } from "react";
import {
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from "../../constants/ui";
import { formatRecoveryCodeInput } from "../../utils/recoveryCode";
import { validateRecoveryCode } from "../../utils/validation";
import { uiSectionHeader } from "../styles/editableStyles";

const RECOVERY_CODE_FORMATTED_LENGTH =
  RECOVERY_CODE_PREFIX.length +
  RECOVERY_CODE_SEGMENTS * (RECOVERY_CODE_SEGMENT_LENGTH + 1);

interface RecoveryCodeInputProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  label?: ReactNode | null;
  labelClassName?: string;
  ariaLabel?: string;
  placeholder?: string;
  size?: "standard" | "large";
  accent?: "red" | "amber";
  showValidation?: boolean;
}

export function RecoveryCodeInput({
  value,
  onValueChange,
  disabled = false,
  label = "Recovery code",
  labelClassName = uiSectionHeader,
  ariaLabel,
  placeholder = "DH-XXXX-XXXX",
  size = "standard",
  accent = "amber",
  showValidation = false,
}: RecoveryCodeInputProps) {
  const inputId = useId();
  const isValid = validateRecoveryCode(value).isValid;
  const sizing =
    size === "large"
      ? "px-4 lg:px-5 py-3 lg:py-3.5 text-base lg:text-lg"
      : "px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base";
  const focusColour = accent === "red" ? "focus:border-red-500" : "focus:border-amber-500";

  const input = (
    <input
      id={inputId}
      type="text"
      value={value}
      onChange={(event) => onValueChange(formatRecoveryCodeInput(event.target.value))}
      placeholder={placeholder}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      maxLength={RECOVERY_CODE_FORMATTED_LENGTH}
      disabled={disabled}
      aria-label={label ? undefined : ariaLabel}
      className={`w-full rounded-lg border border-slate-600 bg-slate-800 font-code [font-feature-settings:'zero'] text-slate-100 placeholder:text-slate-600 focus:outline-none disabled:opacity-50 ${sizing} ${focusColour}`}
    />
  );

  return (
    <label className="block" htmlFor={inputId}>
      {label && <span className={labelClassName}>{label}</span>}
      <div className={label ? "mt-1" : ""}>{input}</div>
      {showValidation && (
        <span className="mt-1 block text-xs lg:text-sm text-slate-400">
          Format: <span className="font-code [font-feature-settings:'zero']">DH-XXXX-XXXX</span>{" "}
          <span className={isValid ? "text-green-400" : "text-slate-500"}>
            {isValid ? "Valid" : "Not valid yet"}
          </span>
        </span>
      )}
    </label>
  );
}
