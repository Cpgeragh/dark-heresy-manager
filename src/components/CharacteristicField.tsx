// src/components/CharacteristicField.tsx

import { useState, useCallback } from "react";
import type { CharField } from "../utils/characterFactory";
import {
  MAX_CHARACTERISTIC_ADVANCES,
  CHARACTERISTIC_ADVANCE_INCREMENT,
  MAX_CHARACTERISTIC_VALUE,
  MIN_CHARACTERISTIC_VALUE,
} from "../constants/gameRules";
import {
  validateCharacteristicBase,
  validateCharacteristicTotal,
} from "../utils/validation";

interface Props {
  label: string;
  value: CharField;
  editable: boolean;
  onChange: (newValue: CharField) => void;
}

export default function CharacteristicField({
  label,
  value,
  editable,
  onChange,
}: Props) {
  const { base, advances } = value;
  const [error, setError] = useState<string | undefined>();

  const toggleAdvance = useCallback(
    (index: number) => {
      if (!editable) return;

      let newAdvances = index < advances ? index : index + 1;

      if (newAdvances < 0) newAdvances = 0;
      if (newAdvances > MAX_CHARACTERISTIC_ADVANCES)
        newAdvances = MAX_CHARACTERISTIC_ADVANCES;

      // Validate total won't exceed max
      const totalCheck = validateCharacteristicTotal(base, newAdvances);
      if (!totalCheck.isValid) {
        setError(totalCheck.error);
        return;
      }

      setError(undefined);
      onChange({ base, advances: newAdvances });
    },
    [editable, base, advances, onChange]
  );

  const updateBase = useCallback(
    (raw: string) => {
      if (!editable) return;

      const num = parseInt(raw, 10);

      // Allow empty during typing
      if (raw === "") {
        setError(undefined);
        return;
      }

      // Validate it's a number
      if (isNaN(num)) {
        setError("Must be a number");
        return;
      }

      // Validate base value range
      const baseCheck = validateCharacteristicBase(num);
      if (!baseCheck.isValid) {
        setError(baseCheck.error);
        return;
      }

      // Validate total won't exceed max
      const totalCheck = validateCharacteristicTotal(num, advances);
      if (!totalCheck.isValid) {
        setError(totalCheck.error);
        return;
      }

      setError(undefined);
      onChange({ base: num, advances });
    },
    [editable, advances, onChange]
  );

  const handleBaseChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBase(e.target.value);
    },
    [updateBase]
  );

  const handleBaseBlur = useCallback(() => {
    // On blur, validate current value
    const baseCheck = validateCharacteristicBase(base);
    if (!baseCheck.isValid) {
      setError(baseCheck.error);
      return;
    }

    const totalCheck = validateCharacteristicTotal(base, advances);
    if (!totalCheck.isValid) {
      setError(totalCheck.error);
    }
  }, [base, advances]);

  const total = base + advances * CHARACTERISTIC_ADVANCE_INCREMENT;

  return (
    <div className="mb-4 p-3 border border-slate-700 rounded-md bg-slate-900/60">
      <div className="font-semibold mb-1">{label}</div>

      {/* Base value */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-400">Base:</span>
        <input
          type="number"
          value={base}
          disabled={!editable}
          onChange={handleBaseChange}
          onBlur={handleBaseBlur}
          min={MIN_CHARACTERISTIC_VALUE}
          max={MAX_CHARACTERISTIC_VALUE}
          aria-label={`${label} base value`}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
          className={`w-20 px-2 py-1 rounded text-slate-100 ${
            error && editable
              ? "bg-slate-800 border border-red-500 focus:border-red-400"
              : "bg-slate-800 border border-slate-600 focus:border-amber-400"
          } focus:outline-none`}
        />
      </div>

      {/* Advances */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-400">Advances:</span>
        {Array.from({ length: MAX_CHARACTERISTIC_ADVANCES }).map((_, idx) => {
          const filled = idx < advances;
          return (
            <button
              key={idx}
              onClick={() => toggleAdvance(idx)}
              disabled={!editable}
              role="button"
              aria-label={`${label} advance ${idx + 1} of ${MAX_CHARACTERISTIC_ADVANCES}`}
              aria-pressed={filled}
              tabIndex={editable ? 0 : -1}
              className={`h-5 w-5 border rounded flex items-center justify-center
                ${
                  filled
                    ? "bg-amber-500 border-amber-400"
                    : "bg-slate-900 border-slate-600"
                }
                ${
                  editable
                    ? "cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    : "opacity-50 cursor-not-allowed"
                }`}
            />
          );
        })}
      </div>

      {/* Total */}
      <div className="text-sm">
        <span className="text-slate-400">Total:</span>
        <span className="ml-2 font-bold">{total}</span>
      </div>

      {/* Error message */}
      {error && editable && (
        <div
          id={`${label}-error`}
          className="text-xs text-red-400 mt-2"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}