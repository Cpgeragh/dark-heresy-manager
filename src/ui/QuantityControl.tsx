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
  size?: "xs" | "sm" | "md" | "lg";
}

const SIZE = {
  xs: {
    btn: "w-5 h-5 text-xs",
    display: "text-xs min-w-[1.25rem]",
    input: "h-5 w-8 text-xs",
  },
  sm: {
    btn: "w-7 h-7 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-sm sm:text-xs lg:text-sm",
    display: "text-sm lg:text-base min-w-[2rem]",
    input: "h-7 sm:h-auto lg:h-8 w-12 lg:w-14 text-sm lg:text-base",
  },
  md: {
    btn: "w-9 h-9 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-lg sm:text-sm lg:text-base",
    display: "text-base lg:text-lg min-w-[2rem]",
    input: "h-9 sm:h-auto lg:h-9 w-14 lg:w-16 text-base lg:text-lg",
  },
  lg: {
    btn: "w-10 h-10 sm:w-6 sm:h-6 lg:w-9 lg:h-9 text-lg sm:text-sm lg:text-lg",
    display: "text-lg lg:text-xl min-w-[2.5rem]",
    input: "h-10 sm:h-auto lg:h-10 w-16 lg:w-20 text-lg lg:text-xl",
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
          className={`${sizeStyles.input} font-code text-slate-100 text-center bg-slate-800 border border-slate-600 rounded focus:outline-none focus:border-indigo-500`}
        />
      ) : (
        <span
          onClick={editable ? start : undefined}
          title={editable ? "Click to set quantity" : undefined}
          className={`${sizeStyles.display} font-code text-slate-100 text-center ${
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
