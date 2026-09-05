// src/components/FormField.tsx

import { useCallback } from "react";
import { uiFormLabel } from "../ui/styles/editableStyles";
import { fieldControlClass } from "../ui/styles/fieldStyles";
import { useDebouncedDraft } from "../hooks/useDebouncedDraft";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  description?: string;
  rows?: number;
  className?: string;
  error?: string;
  onBlur?: () => void;
  debounceMs?: number;
}

export function FormField({
  label,
  value,
  onChange,
  editable = true,
  type = "text",
  placeholder,
  description,
  rows = 3,
  className = "",
  error,
  onBlur,
  debounceMs = 0,
}: FormFieldProps) {
  const hasError = !!error && editable;
  const controlClass = fieldControlClass({
    editable,
    invalid: hasError,
    resize: type === "textarea" ? "vertical" : undefined,
  });

  const inputId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const { draft, updateDraft, flush } = useDebouncedDraft(value, onChange, debounceMs);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (debounceMs > 0) updateDraft(e.target.value);
      else onChange(e.target.value);
    },
    [debounceMs, onChange, updateDraft]
  );

  const handleBlur = useCallback(() => {
    if (debounceMs > 0) flush();
    onBlur?.();
  }, [debounceMs, flush, onBlur]);

  const displayedValue = debounceMs > 0 ? draft : value;

  return (
    <label htmlFor={inputId} className={`flex flex-col gap-0.5 ${className}`}>
      <span className={uiFormLabel}>{label}</span>

      {type === "textarea" ? (
        <textarea
          id={inputId}
          disabled={!editable}
          value={displayedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
          aria-describedby={
            error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined
          }
          aria-invalid={hasError}
          className={controlClass}
        />
      ) : (
        <input
          id={inputId}
          disabled={!editable}
          type={type}
          value={displayedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={
            error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined
          }
          aria-invalid={hasError}
          className={controlClass}
        />
      )}

      {/* Error message (takes precedence over description) */}
      {hasError && (
        <span
          id={`${inputId}-error`}
          className="text-[10px] lg:text-xs text-red-400 mt-0.5"
          role="alert"
        >
          {error}
        </span>
      )}

      {/* Description (only shown if no error) */}
      {!hasError && description && (
        <span id={`${inputId}-desc`} className="text-[10px] lg:text-xs text-slate-500 mt-0.5">
          {description}
        </span>
      )}
    </label>
  );
}
