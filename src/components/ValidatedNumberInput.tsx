// src/components/ValidatedNumberInput.tsx

import { useState, useCallback } from "react";
import { FormField } from "./FormField";
import type { ValidationResult } from "../utils/validation";

interface ValidatedNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  editable?: boolean;
  placeholder?: string;
  description?: string;
  className?: string;
  validator?: (value: number) => ValidationResult;
}

/**
 * Number input with built-in validation.
 * Shows error message if validation fails.
 */
export function ValidatedNumberInput({
  label,
  value,
  onChange,
  editable = true,
  placeholder,
  description,
  className,
  validator,
}: ValidatedNumberInputProps) {
  const [error, setError] = useState<string | undefined>();

  const handleChange = useCallback(
    (strValue: string) => {
      // Allow empty string during typing
      if (strValue === "") {
        setError(undefined);
        return;
      }

      // Parse number
      const numValue = Number(strValue);

      // Check if valid number
      if (isNaN(numValue)) {
        setError(`${label} must be a number`);
        return;
      }

      // Run custom validator if provided
      if (validator) {
        const result = validator(numValue);
        if (!result.isValid) {
          setError(result.error);
          return;
        }
      }

      // Clear error and update value
      setError(undefined);
      onChange(numValue);
    },
    [label, validator, onChange]
  );

  const handleBlur = useCallback(() => {
    // On blur, validate the current value
    if (validator) {
      const result = validator(value);
      if (!result.isValid) {
        setError(result.error);
      }
    }
  }, [value, validator]);

  return (
    <FormField
      label={label}
      value={String(value)}
      onChange={handleChange}
      onBlur={handleBlur}
      editable={editable}
      type="number"
      placeholder={placeholder}
      description={description}
      className={className}
      error={error}
    />
  );
}
