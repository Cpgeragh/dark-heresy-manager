// src/components/CharacteristicField.tsx

import type { CharField } from "../utils/defaultCharacter";

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

  function toggleAdvance(index: number) {
    if (!editable) return;

    // if clicking inside current advance range => shrink
    // if clicking beyond => expand
    let newAdvances = index < advances ? index : index + 1;

    if (newAdvances < 0) newAdvances = 0;
    if (newAdvances > 4) newAdvances = 4;

    onChange({ base, advances: newAdvances });
  }

  function updateBase(raw: string) {
    if (!editable) return;

    const num = parseInt(raw, 10);
    if (isNaN(num)) return;

    onChange({ base: num, advances });
  }

  const total = base + advances * 5;

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
          onChange={(e) => updateBase(e.target.value)}
          className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-100"
        />
      </div>

      {/* Advances */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-400">Advances:</span>
        {Array.from({ length: 4 }).map((_, idx) => {
          const filled = idx < advances;
          return (
            <div
              key={idx}
              onClick={() => toggleAdvance(idx)}
              className={`h-5 w-5 border rounded flex items-center justify-center
                ${
                  filled
                    ? "bg-amber-500 border-amber-400"
                    : "bg-slate-900 border-slate-600"
                }
                ${
                  editable
                    ? "cursor-pointer hover:bg-slate-700"
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