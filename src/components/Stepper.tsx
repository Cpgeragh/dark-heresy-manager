// src/components/Stepper.tsx

import { useState, useCallback } from "react";

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  editable: boolean;
  onChange: (value: number) => void;
  /** Extra Tailwind classes applied to the value display (e.g. danger colour). */
  dangerClassName?: string;
}

/**
 * A +/- stepper for non-negative integers.
 * - Buttons increment/decrement, clamped to `min` (default 0) and `max` (if provided).
 * - Clicking the value opens an inline input for manual entry.
 * - Enter or blur commits; Escape cancels.
 * - Invalid/negative input is clamped to `min`.
 */
export function Stepper({ value, min = 0, max, editable, onChange, dangerClassName }: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = useCallback(
    (raw: string) => {
      const parsed = parseInt(raw, 10);
      const clamped = isNaN(parsed) ? 0 : Math.max(min, Math.round(parsed));
      const next = max !== undefined ? Math.min(max, clamped) : clamped;
      onChange(next);
      setEditing(false);
    },
    [min, max, onChange]
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
      const next = Math.max(min, value + delta);
      onChange(max !== undefined ? Math.min(max, next) : next);
    },
    [editable, min, max, value, onChange]
  );

  const btnClass = `flex items-center justify-center h-full w-7 sm:w-8 lg:w-10 text-lg lg:text-2xl font-bold leading-none pt-0.5 transition select-none ${
    editable
      ? "bg-black/20 text-slate-200 hover:text-red-400 active:scale-95"
      : "bg-black/10 text-slate-500 cursor-not-allowed"
  }`;
  const dividerClass = `h-full w-px ${editable ? "bg-slate-600" : "bg-slate-700"}`;

  return (
    <div
      className={`inline-flex items-center h-7 sm:h-8 lg:h-10 rounded-full border-2 overflow-hidden shadow-lg shadow-black/40 ${
        editable ? "border-slate-600 bg-slate-800" : "border-slate-700 bg-slate-800/50"
      }`}
    >
      <button type="button"
        aria-disabled={!editable}
        onClick={() => adjust(-1)}
        aria-label="Decrease"
        className={btnClass}
      >
        −
      </button>

      <div className={dividerClass} />

      {editing ? (
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          onFocus={(e) => e.target.select()}
          value={draft}
          size={Math.max(2, draft.length)}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "");
            if (max !== undefined && digitsOnly !== "" && parseInt(digitsOnly, 10) > max) return;
            setDraft(digitsOnly);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-full px-1 text-center bg-transparent text-base lg:text-lg font-code text-slate-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <span
          onClick={handleClick}
          title={editable ? "Click to edit" : undefined}
          className={`flex items-center justify-center h-full min-w-7 sm:min-w-8 lg:min-w-10 px-1.5 text-center text-xl lg:text-2xl font-semibold font-code select-none transition-colors ${
            dangerClassName || "text-slate-100"
          } ${editable ? "cursor-pointer hover:text-red-400" : ""}`}
        >
          {value}
        </span>
      )}

      <div className={dividerClass} />

      <button type="button"
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
