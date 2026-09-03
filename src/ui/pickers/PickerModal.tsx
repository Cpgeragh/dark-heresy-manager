// src/ui/pickers/PickerModal.tsx
// Shared reference-picker layout: header, search input, scrollable list, and footer.

import { useLayoutEffect, useRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { editableInputClass } from "../styles/editableStyles";
import { ModalHeader } from "../modals/ModalHeader";
import { ModalShell } from "../modals/ModalShell";
import { PlusIcon } from "../icons/PlusIcon";
import { uiPickerPressFeedback } from "../styles/buttonStyles";

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
  card?: boolean;
};

export function PickerRow({
  children,
  className = "",
  disabled = false,
  interactive = true,
  onClick,
  selected = false,
  card = false,
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
      className={`w-full text-left ${card ? "p-3 lg:p-4" : "px-4 lg:px-5 py-3 lg:py-4"} transition ${
        respondsToInput ? "group" : ""
      } ${selected ? "bg-slate-800" : respondsToInput ? "hover:bg-slate-800" : ""} ${
        respondsToInput ? "cursor-pointer" : disabled ? "" : "cursor-default"
      } ${uiPickerPressFeedback(respondsToInput)} disabled:opacity-40 disabled:cursor-not-allowed ${className}`.trim()}
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
  const label = typeof children === "string"
    ? children.trim().replace(/^\+\s*/, "")
    : children;

  return (
    <button
      type={type}
      className={`group flex w-full items-center justify-center gap-2 rounded border border-red-500/70 bg-red-950/20 py-2.5 text-sm text-red-400 transition hover:border-red-400 hover:bg-red-950/35 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 lg:text-base ${uiPickerPressFeedback(!props.disabled)} ${className}`.trim()}
      {...props}
    >
      <PlusIcon className="h-4 w-4 shrink-0" />
      <span
        className="font-bold capitalize"
        style={{ WebkitTextStroke: "0.35px currentColor" }}
      >
        {label}
      </span>
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
  /** Optional form-lifetime scroll position used when a sub-picker temporarily replaces this modal. */
  scrollPositionRef?: { current: number };
  /** Keep the picker mounted without displaying its dialog or backdrop. */
  suspended?: boolean;
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
  scrollPositionRef,
  suspended = false,
  children,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (listRef.current && scrollPositionRef) {
      listRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [scrollPositionRef]);

  return (
    <ModalShell
      ariaLabel={title}
      onClose={onClose}
      suspended={suspended}
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
      <div
        ref={listRef}
        onScroll={
          scrollPositionRef
            ? (event) => { scrollPositionRef.current = event.currentTarget.scrollTop; }
            : undefined
        }
        className="min-h-0 overflow-y-auto flex-1 divide-y divide-slate-800"
      >
        {isEmpty && <p className="p-4 lg:p-5 text-sm lg:text-base text-slate-500 text-center">{emptyMessage}</p>}
        {children}
      </div>

      {/* Optional footer (e.g. "+ Add custom" button or specialisation form) */}
      {footer && <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700">{footer}</div>}
    </ModalShell>
  );
}
