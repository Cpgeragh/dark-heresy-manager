// src/ui/editableStyles.ts

/**
 * Shared visual language for editable vs read-only UI.
 *
 * IMPORTANT:
 * - These helpers do NOT decide permissions.
 * - They only reflect a decision already made elsewhere.
 */

export function editableInputClass(isEditable: boolean) {
  return [
    "w-full rounded border px-2 py-1 text-sm transition",
    isEditable
      ? [
          "bg-slate-900",
          "border-slate-500",
          "text-slate-100",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-amber-500",
        ].join(" ")
      : [
          "bg-slate-800",
          "border-slate-500",
          "text-slate-400",
          "opacity-70",
          "cursor-not-allowed",
        ].join(" "),
  ].join(" ");
}

export function editableTextareaClass(isEditable: boolean) {
  return [
    "w-full rounded border px-2 py-1 text-sm transition resize-y",
    isEditable
      ? [
          "bg-slate-900",
          "border-slate-500",
          "text-slate-100",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-amber-500",
        ].join(" ")
      : [
          "bg-slate-800",
          "border-slate-500",
          "text-slate-400",
          "opacity-70",
          "cursor-not-allowed",
        ].join(" "),
  ].join(" ");
}

export function sectionContainerClass(isEditable: boolean) {
  return [
    "rounded-lg border p-3",
    isEditable
      ? "border-slate-500 bg-slate-900/40"
      : "border-slate-800 bg-slate-900/20",
  ].join(" ");
}

// ─── Shared UI tokens ─────────────────────────────────────────────────────────
// Use these instead of hardcoding the same Tailwind strings across components.

/** Section header label — sits outside its box, clearly readable. */
export const uiSectionHeader = "text-sm font-semibold text-slate-100 uppercase tracking-wide";

/** Standard section card — bright border, semi-transparent background. */
export const uiSection = "rounded-lg border border-slate-500 bg-slate-800/60 p-3";

/** Inner cell within a section (no padding — add your own). */
export const uiCell = "rounded border border-slate-500 bg-slate-800/60";

/** Label inside a compact stat cell (tight column grids: Quick View, bonuses, movement). */
export const uiCellLabel = "text-[10px] text-slate-100 leading-tight";

/** Value inside a compact stat cell (tight column grids — keeps text-base to fit). */
export const uiCellValueSm = "text-base font-semibold font-mono text-slate-100 leading-tight";

/** Value inside a standard-width display cell — matches the Stepper value size. */
export const uiCellValue = "text-xl font-semibold font-mono text-slate-100";

// ──────────────────────────────────────────────────────────────────────────────

export function readOnlyBadgeClass() {
  return [
    "inline-block",
    "px-2 py-0.5",
    "rounded-full",
    "text-xs",
    "bg-slate-800",
    "text-slate-400",
    "border",
    "border-slate-500",
  ].join(" ");
}