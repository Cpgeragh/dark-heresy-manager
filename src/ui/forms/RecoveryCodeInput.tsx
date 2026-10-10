import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type ReactNode,
} from "react";
import {
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
} from "shared-rules";
import { formatRecoveryCodeInputChange } from "../../utils/recoveryCode";
import { validateRecoveryCode } from "../../utils/validation";
import {
  editableInputClass,
  editableInputColour,
  uiSectionHeader,
  uiTextMeta,
} from "../styles/editableStyles";
import { colourSuccessPlain } from "../styles/colourTokens";

const RECOVERY_CODE_FORMATTED_LENGTH =
  RECOVERY_CODE_PREFIX.length + RECOVERY_CODE_SEGMENTS * (RECOVERY_CODE_SEGMENT_LENGTH + 1);

interface RecoveryCodeInputProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  label?: ReactNode | null;
  labelAside?: ReactNode;
  labelClassName?: string;
  ariaLabel?: string;
  placeholder?: string;
  size?: "standard" | "large";
  appearance?: "recovery" | "form";
  showValidation?: boolean;
}

export function RecoveryCodeInput({
  value,
  onValueChange,
  disabled = false,
  label = "Recovery code",
  labelAside,
  labelClassName = uiSectionHeader,
  ariaLabel,
  placeholder = "DH-XXXX-XXXX",
  size = "standard",
  appearance = "recovery",
  showValidation = false,
}: RecoveryCodeInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const fixedPrefix = `${RECOVERY_CODE_PREFIX}-`;
  const displayedValue = focused && !value ? fixedPrefix : value;
  const isValid = validateRecoveryCode(value).isValid;
  const sizing =
    size === "large"
      ? "px-4 lg:px-5 py-3 lg:py-3.5 text-base lg:text-lg"
      : "px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base";

  useLayoutEffect(() => {
    if (!focused || value) return;
    inputRef.current?.setSelectionRange(fixedPrefix.length, fixedPrefix.length);
  }, [fixedPrefix.length, focused, value]);

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="text"
      value={displayedValue}
      onChange={(event) =>
        onValueChange(formatRecoveryCodeInputChange(displayedValue, event.target.value))
      }
      onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
        const pastedValue = event.clipboardData.getData("text");
        if (!pastedValue) return;
        event.preventDefault();
        onValueChange(formatRecoveryCodeInputChange("", pastedValue));
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      maxLength={RECOVERY_CODE_FORMATTED_LENGTH}
      disabled={disabled}
      aria-label={label ? undefined : ariaLabel}
      className={
        appearance === "form"
          ? `${editableInputClass(!disabled)} font-code [font-feature-settings:'zero']`
          : `w-full rounded-lg border font-code [font-feature-settings:'zero'] ${editableInputColour(!disabled)} ${sizing}`
      }
    />
  );

  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center gap-1.5">
          <label htmlFor={inputId}>
            <span className={labelClassName}>{label}</span>
          </label>
          {labelAside}
        </div>
      )}
      {input}
      {showValidation && (
        <span className={`mt-1 block ${uiTextMeta}`}>
          Format: <span className="font-code [font-feature-settings:'zero']">DH-XXXX-XXXX</span>{" "}
          <span className={isValid ? colourSuccessPlain : undefined}>
            {isValid ? "Valid" : "Not valid yet"}
          </span>
        </span>
      )}
    </div>
  );
}
