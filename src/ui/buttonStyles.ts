// src/ui/buttonStyles.ts

const uiActionButtonBase =
  "inline-flex items-center justify-center gap-1 rounded border border-red-500 text-red-500 font-semibold leading-none whitespace-nowrap hover:bg-red-500/10 transition";

export const uiActionButton =
  `${uiActionButtonBase} text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5`;

export const uiActionButtonCompact =
  `${uiActionButtonBase} text-xs lg:text-sm px-2 py-0.5`;

export const uiIconButton =
  "w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg lg:text-xl leading-none transition";

export const uiPickerBackButton =
  "px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100";

export const uiDismissButton =
  "text-slate-400 hover:text-slate-200 text-lg leading-none";

export const uiExpandButton =
  "flex-1 min-w-0 text-left";

export const uiTabButtonBase =
  "rounded-md px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border";

export const uiTabButtonBaseCompact =
  "rounded-md px-1 py-1.5 text-[11px] font-semibold transition border";

export const uiTabButtonInactive =
  "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200";
