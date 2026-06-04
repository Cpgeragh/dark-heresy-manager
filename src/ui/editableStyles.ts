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

/** @deprecated Use uiSection directly */
export function sectionContainerClass(_isEditable: boolean) {
  return uiSection;
}

// ─── Shared UI tokens ─────────────────────────────────────────────────────────
// Use these instead of hardcoding the same Tailwind strings across components.

/** Section header label — amber left-border accent, sits outside or at the top of its box. */
export const uiSectionHeader = "border-l-2 border-amber-500 pl-2 text-xs font-semibold uppercase tracking-widest text-amber-400";

/** Standard section card — bright border, semi-transparent background. */
export const uiSection = "rounded-lg border border-slate-500 bg-slate-900/60 p-3";

/** Inner cell within a section (no padding — add your own). */
export const uiCell = "rounded border border-slate-500 bg-slate-950/60";

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