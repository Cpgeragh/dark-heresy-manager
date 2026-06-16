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
      const next = isNaN(parsed) ? value : Math.max(min, Math.round(Math.abs(parsed)));
      onChange(next);
      setEditing(false);
    },
    [value, min, onChange]
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

  const btnClass = `flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 border rounded-lg text-lg leading-none text-slate-100 transition select-none ${
    editable
      ? "bg-slate-800 border-slate-500 hover:bg-slate-700 active:bg-slate-600"
      : "bg-slate-800 border-slate-500 opacity-50 cursor-not-allowed"
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
          type="number"
          min={min}
          step={1}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-10 sm:h-8 w-14 text-center bg-slate-700 border border-slate-500 rounded-lg text-base font-mono text-slate-100 px-1 focus:outline-none focus:border-red-500"
        />
      ) : (
        <span
          onClick={handleClick}
          title={editable ? "Click to edit" : undefined}
          className={`min-w-[2.5ch] text-center text-xl font-semibold font-mono select-none ${
            dangerClassName || "text-slate-100"
          } ${editable ? "cursor-pointer hover:opacity-80" : ""}`}
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
