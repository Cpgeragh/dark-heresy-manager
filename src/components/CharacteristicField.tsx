// src/components/CharacteristicField.tsx

import { useState, useCallback, useRef } from "react";
import type { CharField } from "../utils/characterFactory";
import {
  MAX_CHARACTERISTIC_ADVANCES,
  CHARACTERISTIC_ADVANCE_INCREMENT,
} from "../constants/gameRules";
import { validateCharacteristicBase, validateCharacteristicTotal } from "../utils/validation";

interface Props {
  label: string;
  value: CharField;
  editable: boolean;
  onChange: (newValue: CharField) => void;
}

export default function CharacteristicField({ label, value, editable, onChange }: Props) {
  const { base, advances } = value;
  const [error, setError] = useState<string | undefined>();
  const [draft, setDraft] = useState(String(base));
  const isFocused = useRef(false);

  // ── Base input handlers ────────────────────────────────────────────────────

  function commitBase(raw: string) {
    const num = parseInt(raw, 10);

    if (raw.trim() === "" || isNaN(num)) {
      setDraft(String(base)); // revert to last committed value
      setError(undefined);
      return;
    }

    const baseCheck = validateCharacteristicBase(num);
    if (!baseCheck.isValid) {
      setError(baseCheck.error);
      setDraft(String(base));
      return;
    }

    const totalCheck = validateCharacteristicTotal(num, advances);
    if (!totalCheck.isValid) {
      setError(totalCheck.error);
      setDraft(String(base));
      return;
    }

    setError(undefined);
    onChange({ base: num, advances });
  }

  const handleBaseFocus = useCallback(() => {
    isFocused.current = true;
    setDraft(String(base)); // sync to current committed value on focus
  }, [base]);

  const handleBaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip anything that isn't a digit — no minus, no decimal, no letters
    setDraft(e.target.value.replace(/\D/g, ""));
  }, []);

  const handleBaseBlur = useCallback(() => {
    isFocused.current = false;
    commitBase(draft);
  }, [draft, base, advances, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBaseKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitBase(draft);
      if (e.key === "Escape") {
        setDraft(String(base));
        setError(undefined);
        (e.target as HTMLInputElement).blur();
      }
    },
    [draft, base, advances, onChange] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleAdvance = useCallback(
    (index: number) => {
      if (!editable) return;

      let newAdvances = index < advances ? index : index + 1;

      if (newAdvances < 0) newAdvances = 0;
      if (newAdvances > MAX_CHARACTERISTIC_ADVANCES) newAdvances = MAX_CHARACTERISTIC_ADVANCES;

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

  const total = base + advances * CHARACTERISTIC_ADVANCE_INCREMENT;

  return (
    <div className="mb-4 p-3 border border-slate-700 rounded-md bg-slate-900/60">
      <div className="font-semibold mb-1">{label}</div>

      {/* Base value */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-400">Base:</span>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          disabled={!editable}
          onFocus={handleBaseFocus}
          onChange={handleBaseChange}
          onBlur={handleBaseBlur}
          onKeyDown={handleBaseKeyDown}
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
                ${filled ? "bg-amber-500 border-amber-400" : "bg-slate-900 border-slate-600"}
                ${
                  editable
                    ? "cursor-pointer hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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
        <div id={`${label}-error`} className="text-xs text-red-400 mt-2" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
