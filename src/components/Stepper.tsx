// src/components/Stepper.tsx

import { useState, useCallback } from "react";

interface StepperProps {
  value: number;
  min?: number;
  editable: boolean;
  onChange: (value: number) => void;
  /** Extra Tailwind classes applied to the value display (e.g. danger colour). */
  dangerClassName?: string;
}

/**
 * A +/- stepper for non-negative integers.
 * - Buttons increment/decrement, clamped to `min` (default 0).
 * - Clicking the value opens an inline input for manual entry.
 * - Enter or blur commits; Escape cancels.
 * - Invalid/negative input is clamped to `min`.
 */
export function Stepper({ value, min = 0, editable, onChange, dangerClassName }: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = useCallback(
    (raw: string) => {
      const parsed = parseInt(raw, 10);
      const next = isNaN(parsed) ? 0 : Math.max(min, Math.round(parsed));
      onChange(next);
      setEditing(false);
    },
    [min, onChange]
  );

  const handleClick = useCallback(() => {
    if (!editable) return;
    setDraft(String(value));
    setEditing(true);
  }, [editable, value]);

  const handleBlur = useCallback(() => commit(draft), [commit, draft]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commit(draft);
      if (e.key === "Escape") setEditing(false);
    },
    [commit, draft]
  );

  const adjust = useCallback(
    (delta: number) => {
      if (!editable) return;
      onChange(Math.max(min, value + delta));
    },
    [editable, min, value, onChange]
  );

  const btnClass = `flex items-center justify-center pt-0.5 h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded text-base lg:text-xl leading-none text-slate-300 transition select-none ${
    editable
      ? "bg-slate-700 hover:bg-slate-600"
      : "bg-slate-700 opacity-50 cursor-not-allowed"
  }`;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        aria-disabled={!editable}
        onClick={() => adjust(-1)}
        aria-label="Decrease"
        className={btnClass}
      >
        −
      </button>

      {editing ? (
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          onFocus={(e) => e.target.select()}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-7 sm:h-8 lg:h-10 w-7 sm:w-8 lg:w-10 text-center bg-slate-700 border border-slate-500 rounded-lg text-base lg:text-lg font-code text-slate-100 focus:outline-none focus:border-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <span
          onClick={handleClick}
          title={editable ? "Click to edit" : undefined}
          className={`w-7 sm:w-8 lg:w-10 text-center text-xl lg:text-2xl font-semibold font-code select-none ${
            dangerClassName || "text-slate-100"
          } ${editable ? "cursor-pointer border border-slate-500 rounded flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 bg-slate-900 hover:border-slate-400 transition-colors" : ""}`}
        >
          {value}
        </span>
      )}

      <button
        aria-disabled={!editable}
        onClick={() => adjust(1)}
        aria-label="Increase"
        className={btnClass}
      >
        +
      </button>
    </div>
  );
}
