// src/ui/editableStyles.ts

import { chipClassName } from "./Chip";

/**
 * Shared UI styles and tokens.
 *
 * - editableInputClass / editableTextareaClass / readOnlyBadgeClass:
 *   reflect an editable/read-only decision already made elsewhere.
 * - uiSection / uiCell / uiCellLabel etc.:
 *   shared layout tokens used across tab components.
 *
 * IMPORTANT: These helpers do NOT decide permissions.
 * They only reflect a decision already made elsewhere.
 */

export function editableInputClass(isEditable: boolean) {
  return [
    "w-full rounded border px-2 py-1 text-sm lg:text-base transition",
    isEditable
      ? [
          "bg-slate-900",
          "border-slate-500",
          "text-slate-200",
          "focus:outline-none",
          "focus:border-red-500",
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
    "w-full rounded border px-2 py-1 text-sm lg:text-base transition resize-y",
    isEditable
      ? [
          "bg-slate-900",
          "border-slate-500",
          "text-slate-200",
          "focus:outline-none",
          "focus:border-red-500",
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

// ─── Shared UI tokens ─────────────────────────────────────────────────────────
// Use these instead of hardcoding the same Tailwind strings across components.

/** Section header label — amber left-border accent, sits outside or at the top of its box. */
export const uiSectionHeader =
  "border-l-2 border-red-700 pl-2 text-xs lg:text-sm font-cinzel font-semibold uppercase tracking-widest text-red-500";

/** Standard section card — bright border, semi-transparent background. */
export const uiSection = "rounded-lg border border-slate-500 bg-slate-900/60 p-3 lg:p-4";

/** Shared red outline action button styles. */
const uiActionButtonBase =
  "inline-flex items-center justify-center gap-1 rounded border border-red-500 text-red-500 font-semibold leading-none whitespace-nowrap hover:bg-red-500/10 transition";

export const uiActionButton =
  `${uiActionButtonBase} text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5`;

export const uiActionButtonCompact =
  `${uiActionButtonBase} text-xs lg:text-sm px-2 py-0.5`;

export const uiCell = "rounded border border-slate-500 bg-slate-950/60";

/** Label inside a compact stat cell (tight column grids: Quick View, bonuses, movement). */
export const uiCellLabel = "text-[10px] lg:text-xs text-slate-300 leading-tight";

/** Value inside a compact stat cell (tight column grids — keeps text-base to fit). */
export const uiCellValueSm = "text-base lg:text-lg font-semibold font-code text-slate-200 leading-tight";

/** Value inside a standard-width display cell — matches the Stepper value size. */
export const uiCellValue = "text-xl lg:text-2xl font-semibold font-code text-slate-200";

// ─── Shared text tone tokens ─────────────────────────────────────────────────
// Use these to keep real content readable and reserve the dimmest grey for
// placeholders, empty states, and low-priority metadata.

/** Primary readable body text for rules, notes, descriptions, and explanations. */
export const uiTextBody = "text-slate-300";

/** Secondary readable text for less prominent facts that are still meaningful. */
export const uiTextMuted = "text-slate-300/90";

/** Low-priority metadata, dividers, and compact supporting details. */
export const uiTextSubtle = "text-slate-500";

/** Empty-state or placeholder-like text. */
export const uiTextPlaceholder = "text-slate-500 italic";

/** Tiny uppercase label text used beside values. */
export const uiTextLabel = "text-[10px] lg:text-xs text-sky-300/85 uppercase tracking-wide";

// ──────────────────────────────────────────────────────────────────────────────

export function readOnlyBadgeClass() {
  return chipClassName({ className: "border-slate-600 bg-slate-800/40 text-slate-300" });
}
