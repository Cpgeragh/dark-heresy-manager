// src/components/Stepper.tsx

import { useState, useCallback } from "react";
import { useReturnFocusAfterEdit } from "../hooks/useReturnFocusAfterEdit";
import { MinusIcon } from "../ui/icons/MinusIcon";
import { PlusIcon } from "../ui/icons/PlusIcon";
import {
  uiEditableValueHover,
  uiFocusRing,
  uiFocusRingInset,
  uiStepButtonColour,
  uiStepButtonDisabled,
} from "../ui/styles/buttonStyles";
import {
  colourControlDivider,
  colourControlDividerDisabled,
  colourControlShadow,
  colourControlSurface,
  colourControlSurfaceDisabled,
  colourTextPrimary,
} from "../ui/styles/colourTokens";

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
export function Stepper({
  value,
  min = 0,
  max,
  editable,
  onChange,
  dangerClassName,
}: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const { valueRef, markReturn } = useReturnFocusAfterEdit(editing);

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
    editable ? `${uiStepButtonColour} ${uiFocusRingInset}` : uiStepButtonDisabled
  }`;
  const dividerClass = `h-full w-px ${editable ? colourControlDivider : colourControlDividerDisabled}`;
  const valueClass = `flex items-center justify-center h-full min-w-7 sm:min-w-8 lg:min-w-10 px-1.5 text-center text-xl lg:text-2xl font-semibold font-code select-none transition-colors ${
    dangerClassName || colourTextPrimary
  }`;

  return (
    <div
      className={`inline-flex items-center h-7 sm:h-8 lg:h-10 rounded-full border-2 overflow-hidden ${colourControlShadow} ${
        editable ? colourControlSurface : colourControlSurfaceDisabled
      }`}
    >
      <button
        type="button"
        disabled={!editable}
        aria-disabled={!editable}
        onClick={() => adjust(-1)}
        aria-label="Decrease"
        className={btnClass}
      >
        <MinusIcon className="h-[1em] w-[1em]" />
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
          onKeyDown={(e) => {
            markReturn(e);
            handleKeyDown(e);
          }}
          className={`h-full px-1 text-center bg-transparent text-base lg:text-lg font-code ${colourTextPrimary} ${uiFocusRing} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          autoComplete="off"
        />
      ) : editable ? (
        <button
          ref={valueRef}
          type="button"
          onClick={handleClick}
          aria-label={`Edit value, currently ${value}`}
          title="Click to edit"
          className={`${valueClass} cursor-pointer ${uiEditableValueHover} ${uiFocusRingInset}`}
        >
          {value}
        </button>
      ) : (
        <span className={valueClass}>{value}</span>
      )}

      <div className={dividerClass} />

      <button
        type="button"
        disabled={!editable}
        aria-disabled={!editable}
        onClick={() => adjust(1)}
        aria-label="Increase"
        className={btnClass}
      >
        <PlusIcon className="h-[1em] w-[1em]" />
      </button>
    </div>
  );
}
