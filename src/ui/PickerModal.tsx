// src/ui/PickerModal.tsx
// Shared reference-picker layout: header, search input, scrollable list, and footer.

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { editableInputClass } from "./editableStyles";
import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

export function PickerBody({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 lg:p-5 space-y-4 ${className}`.trim()}
      {...props}
    />
  );
}

export type PickerRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  interactive?: boolean;
  selected?: boolean;
};

export function PickerRow({
  children,
  className = "",
  disabled = false,
  interactive = true,
  onClick,
  selected = false,
  tabIndex,
  type = "button",
  ...props
}: PickerRowProps) {
  const respondsToInput = interactive && !disabled;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={respondsToInput ? onClick : undefined}
      tabIndex={respondsToInput ? tabIndex : -1}
      className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition ${
        respondsToInput ? "group" : ""
      } ${selected ? "bg-slate-800" : respondsToInput ? "hover:bg-slate-800" : ""} ${
        respondsToInput ? "cursor-pointer" : disabled ? "" : "cursor-default"
      } disabled:opacity-40 disabled:cursor-not-allowed ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export type PickerCustomActionProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PickerCustomAction({
  children,
  className = "",
  type = "button",
  ...props
}: PickerCustomActionProps) {
  return (
    <button
      type={type}
      className={`w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5 transition ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

interface Props {
  title: string;
  titleClassName?: string;
  placeholder?: string;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  /** True when the filtered list is empty — renders the empty-state message. */
  isEmpty: boolean;
  emptyMessage?: string;
  /** Content for a non-close header action, such as a two-step modal's back arrow. */
  closeLabel?: ReactNode;
  /** Accessible label for the close/back button. Defaults to "Close". */
  closeAriaLabel?: string;
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
  /** Override the container max-height. Defaults to "max-h-[85vh]". */
  maxHeight?: string;
  /** Override the container max-width. Defaults to the wider picker-list width. */
  maxWidth?: string;
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
  titleClassName,
  closeLabel,
  closeAriaLabel = "Close",
  hideSearch = false,
  filterRow,
  footer,
  maxHeight = "max-h-[85vh]",
  maxWidth = "max-w-lg lg:max-w-2xl",
  children,
}: Props) {
  return (
    <ModalShell
      ariaLabel={title}
      onClose={onClose}
      viewportAware
      className={`min-h-0 ${maxWidth} flex flex-col overflow-hidden ${maxHeight}`}
    >
      <ModalHeader
        title={title}
        titleClassName={titleClassName}
        onClose={onClose}
        action={closeAriaLabel === "Close" ? undefined : closeLabel}
        actionAriaLabel={closeAriaLabel}
      />

      {/* Search */}
      {!hideSearch && (
        <div className="px-4 lg:px-5 py-2 lg:py-3 border-b border-slate-800">
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className={editableInputClass(true)}
          />
        </div>
      )}

      {/* Optional filter row (e.g. discipline chips) */}
      {filterRow && (
        <div className="px-4 lg:px-5 py-2 lg:py-3 border-b border-slate-800 flex flex-wrap gap-1.5 justify-center">
          {filterRow}
        </div>
      )}

      {/* Scrollable list */}
      <div className="min-h-0 overflow-y-auto flex-1 divide-y divide-slate-800">
        {isEmpty && <p className="p-4 lg:p-5 text-sm lg:text-base text-slate-500 text-center">{emptyMessage}</p>}
        {children}
      </div>

      {/* Optional footer (e.g. "+ Add custom" button or specialisation form) */}
      {footer && <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700">{footer}</div>}
    </ModalShell>
  );
}
