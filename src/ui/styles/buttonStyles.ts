// src/ui/styles/buttonStyles.ts

export const uiPickerBackButton =
  "px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100 transition";

const PICKER_PRESS_FEEDBACK =
  "active:scale-[0.99] active:!border-red-400 active:!bg-slate-700 active:ring-1 active:ring-red-400/70";

/** Shared phone press feedback for every interactive picker surface. */
export function uiPickerPressFeedback(interactive = true): string {
  return interactive ? PICKER_PRESS_FEEDBACK : "";
}

export const uiDismissButton =
  "text-slate-400 hover:text-slate-200 text-lg leading-none";

export const uiExpandButton =
  "flex-1 min-w-0 text-left";

export const uiIconRemoveButton =
  "inline-flex items-center justify-center rounded border border-red-500 text-red-500 hover:bg-red-500/10 transition p-1 shrink-0";

export const uiIconAddButton =
  "inline-flex items-center justify-center rounded border border-red-500 text-red-500 hover:bg-red-500/10 transition p-1.5 shrink-0";
