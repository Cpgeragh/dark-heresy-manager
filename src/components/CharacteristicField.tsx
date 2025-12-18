// src/components/CharacteristicField.tsx

import { useCallback } from "react";
import type { CharField } from "../utils/characterFactory";
import { 
  MAX_CHARACTERISTIC_ADVANCES,
  CHARACTERISTIC_ADVANCE_INCREMENT 
} from "../constants/gameRules";

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

  const toggleAdvance = useCallback((index: number) => {
    if (!editable) return;

    let newAdvances = index < advances ? index : index + 1;

    if (newAdvances < 0) newAdvances = 0;
    if (newAdvances > MAX_CHARACTERISTIC_ADVANCES) newAdvances = MAX_CHARACTERISTIC_ADVANCES;

    onChange({ base, advances: newAdvances });
  }, [editable, base, advances, onChange]);

  const updateBase = useCallback((raw: string) => {
    if (!editable) return;

    const num = parseInt(raw, 10);
    if (isNaN(num)) return;

    onChange({ base: num, advances });
  }, [editable, advances, onChange]);

  const handleBaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateBase(e.target.value);
  }, [updateBase]);

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
          aria-label={`${label} base value`}
          className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-100"
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
    </div>
  );
}