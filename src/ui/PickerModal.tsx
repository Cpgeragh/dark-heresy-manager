// src/ui/PickerModal.tsx
// Shared shell for reference-picker modals: backdrop, header, search input, scrollable list.

import type { ReactNode } from "react";
import { editableInputClass } from "./editableStyles";

interface Props {
  title: string;
  placeholder?: string;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  /** True when the filtered list is empty — renders the empty-state message. */
  isEmpty: boolean;
  emptyMessage?: string;
  /**
   * Label for the close/back button. Defaults to "×".
   * Pass "←" for a two-step modal's back button.
   */
  closeLabel?: string;
  /**
   * When true the search input row is hidden.
   * Use for a second "form" step that replaces the search list.
   */
  hideSearch?: boolean;
  /**
   * Optional row rendered between the search input and the list.
   * Use for discipline/category filter chips (e.g. PsychicTab).
   */
  filterRow?: ReactNode;
  /**
   * Optional footer rendered below the list.
   * Use for "+ Add custom …" buttons or specialisation confirm forms.
   */
  footer?: ReactNode;
  /** Override the container max-height. Defaults to "max-h-[80vh]". */
  maxHeight?: string;
  /** The list rows. */
  children: ReactNode;
}

/**
 * Modal shell for all searchable reference pickers.
 * Callers keep their own query state and filtering logic;
 * this component owns the backdrop, header, search box, empty state, and list frame.
 */
export function PickerModal({
  title,
  placeholder = "Search…",
  query,
  onQueryChange,
  onClose,
  isEmpty,
  emptyMessage = "No matches.",
  closeLabel = "×",
  hideSearch = false,
  filterRow,
  footer,
  maxHeight = "max-h-[80vh]",
  children,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col ${maxHeight}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            {closeLabel}
          </button>
        </div>

        {/* Search */}
        {!hideSearch && (
          <div className="px-4 py-2 border-b border-slate-800">
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className={editableInputClass(true)}
            />
          </div>
        )}

        {/* Optional filter row (e.g. discipline chips) */}
        {filterRow && (
          <div className="px-4 py-2 border-b border-slate-800 flex flex-wrap gap-1.5">
            {filterRow}
          </div>
        )}

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {isEmpty && <p className="p-4 text-sm text-slate-500 text-center">{emptyMessage}</p>}
          {children}
        </div>

        {/* Optional footer (e.g. "+ Add custom" button or specialisation form) */}
        {footer && <div className="px-4 py-3 border-t border-slate-700">{footer}</div>}
      </div>
    </div>
  );
}
