// src/components/FormField.tsx

import { useCallback } from "react";

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
  error?: string; // NEW: validation error message
  onBlur?: () => void; // NEW: for validation on blur
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
  error, // NEW
  onBlur, // NEW
}: FormFieldProps) {
  const hasError = !!error && editable;

  const baseInputClass = `
    px-2 py-1 rounded border text-sm
    ${
      editable
        ? hasError
          ? "bg-slate-800 border-red-500 text-slate-100 focus:border-red-400 focus:outline-none"
          : "bg-slate-800 border-slate-600 text-slate-100 focus:border-amber-400 focus:outline-none"
        : "bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed"
    }
  `.trim();

  const inputId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <label
      htmlFor={inputId}
      className={`flex flex-col gap-0.5 text-xs text-slate-400 ${className}`}
    >
      {label}

      {type === "textarea" ? (
        <textarea
          id={inputId}
          disabled={!editable}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
          aria-describedby={
            error
              ? `${inputId}-error`
              : description
              ? `${inputId}-desc`
              : undefined
          }
          aria-invalid={hasError}
          className={baseInputClass + " resize-y"}
        />
      ) : (
        <input
          id={inputId}
          disabled={!editable}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={
            error
              ? `${inputId}-error`
              : description
              ? `${inputId}-desc`
              : undefined
          }
          aria-invalid={hasError}
          className={baseInputClass}
        />
      )}

      {/* Error message (takes precedence over description) */}
      {hasError && (
        <span
          id={`${inputId}-error`}
          className="text-[10px] text-red-400 mt-0.5"
          role="alert"
        >
          {error}
        </span>
      )}

      {/* Description (only shown if no error) */}
      {!hasError && description && (
        <span id={`${inputId}-desc`} className="text-[10px] text-slate-500 mt-0.5">
          {description}
        </span>
      )}
    </label>
  );
}