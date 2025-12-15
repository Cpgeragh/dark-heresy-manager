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
          "border-slate-600",
          "text-slate-100",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-amber-500",
        ].join(" ")
      : [
          "bg-slate-800",
          "border-slate-700",
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
          "border-slate-600",
          "text-slate-100",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-amber-500",
        ].join(" ")
      : [
          "bg-slate-800",
          "border-slate-700",
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
      ? "border-slate-700 bg-slate-900/40"
      : "border-slate-800 bg-slate-900/20",
  ].join(" ");
}

export function readOnlyBadgeClass() {
  return [
    "inline-block",
    "px-2 py-0.5",
    "rounded-full",
    "text-xs",
    "bg-slate-800",
    "text-slate-400",
    "border",
    "border-slate-700",
  ].join(" ");
}