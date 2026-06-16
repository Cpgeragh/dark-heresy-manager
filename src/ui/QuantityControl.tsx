// src/ui/QuantityControl.tsx
// Inline quantity editor: decrement button, click-to-type display, increment button.

import { useQuantityEdit } from "../hooks/useQuantityEdit";

interface Props {
  quantity: number;
  editable: boolean;
  onUpdate: (qty: number) => void;
  /**
   * Visual size variant:
   *  "sm" → w-5/h-5 buttons, text-xs button text, text-sm display  (consumables)
   *  "md" → w-6/h-6 buttons, text-sm button text, text-base display (drugs)       [default]
   *  "lg" → w-6/h-6 buttons, text-sm button text, text-lg display   (ammo/grenades)
   */
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: {
    btn: "w-7 h-7 sm:w-5 sm:h-5 text-sm sm:text-xs",
    display: "text-sm min-w-[2rem]",
    input: "h-7 sm:h-auto w-12 text-sm",
  },
  md: {
    btn: "w-9 h-9 sm:w-6 sm:h-6 text-lg sm:text-sm",
    display: "text-base min-w-[2rem]",
    input: "h-9 sm:h-auto w-14 text-base",
  },
  lg: {
    btn: "w-10 h-10 sm:w-6 sm:h-6 text-lg sm:text-sm",
    display: "text-lg min-w-[2.5rem]",
    input: "h-10 sm:h-auto w-16 text-lg",
  },
} as const;

export function QuantityControl({ quantity, editable, onUpdate, size = "md" }: Props) {
  const sizeStyles = SIZE[size];
  const { editing, draft, setDraft, start, commit, handleKeyDown } = useQuantityEdit(
    quantity,
    onUpdate
  );

  return (
    <div className="flex items-center gap-1">
      {editable && (
        <button
          onClick={() => onUpdate(Math.max(0, quantity - 1))}
          className={`${sizeStyles.btn} rounded bg-slate-700 hover:bg-slate-600 text-slate-300 leading-none flex items-center justify-center`}
        >
          −
        </button>
      )}

      {editable && editing ? (
        <input
          type="text"
          autoFocus
          value={draft}
          inputMode="numeric"
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`${sizeStyles.input} font-mono text-slate-100 text-center bg-slate-800 border border-slate-600 rounded focus:outline-none focus:border-indigo-500`}
        />
      ) : (
        <span
          onClick={editable ? start : undefined}
          title={editable ? "Click to set quantity" : undefined}
          className={`${sizeStyles.display} font-mono text-slate-100 text-center ${
            editable
              ? "cursor-pointer hover:text-white hover:underline decoration-slate-500 decoration-dotted underline-offset-2"
              : ""
          }`}
        >
          {quantity}
        </span>
      )}

      {editable && (
        <button
          onClick={() => onUpdate(quantity + 1)}
          className={`${sizeStyles.btn} rounded bg-slate-700 hover:bg-slate-600 text-slate-300 leading-none flex items-center justify-center`}
        >
          +
        </button>
      )}
    </div>
  );
}
