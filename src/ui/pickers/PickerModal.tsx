// src/ui/pickers/PickerModal.tsx
// Shared reference-picker layout: header, search input, scrollable list, and footer.

import { useLayoutEffect, useRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, MouseEvent, ReactNode } from "react";
import {
  uiChipRow,
  editableInputClass,
  uiInlineRow,
  uiSectionShell,
  uiSpinner,
  uiTextPlaceholder,
} from "../styles/editableStyles";
import { ModalHeader } from "../modals/ModalHeader";
import { ModalShell } from "../modals/ModalShell";
import { PlusIcon } from "../icons/PlusIcon";
import { uiPickerPressFeedback } from "../styles/buttonStyles";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { usePendingClick } from "../usePendingClick";
import { colourDivider } from "../styles/colourTokens";

export function PickerBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 lg:p-5 space-y-4 ${className}`.trim()} {...props} />;
}

/** The padded stack that holds a picker's rows. */
export function PickerList({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-3 p-3 lg:p-4 ${className}`.trim()} {...props} />;
}

export type PickerRowProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  interactive?: boolean;
  selected?: boolean;
  /** Content after the row's main content, such as a drill-down arrow. */
  trailing?: ReactNode;
  /** A handler that returns a promise keeps the row busy, with a spinner, until it settles. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
};

export function PickerRow({
  children,
  className = "",
  disabled = false,
  interactive = true,
  onClick,
  selected = false,
  trailing,
  tabIndex,
  type = "button",
  ...props
}: PickerRowProps) {
  recordComponentRender("PickerRow");
  const { pending, handleClick } = usePendingClick(onClick);
  const respondsToInput = interactive && !disabled;

  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={respondsToInput ? handleClick : undefined}
      tabIndex={respondsToInput ? tabIndex : -1}
      className={`relative w-full text-left ${uiSectionShell} p-3 lg:p-4 transition ${
        respondsToInput ? "group" : ""
      } ${selected ? "!bg-slate-800" : respondsToInput ? "hover:bg-slate-800" : ""} ${
        respondsToInput ? "cursor-pointer" : disabled ? "" : "cursor-default"
      } ${uiPickerPressFeedback(respondsToInput)} ${
        pending ? "cursor-wait" : "disabled:opacity-40 disabled:cursor-not-allowed"
      } ${className}`.trim()}
      {...props}
    >
      {trailing ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">{children}</div>
          {trailing}
        </div>
      ) : (
        children
      )}
      {pending && (
        <span
          className={`${uiSpinner} absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2`}
          aria-hidden="true"
        />
      )}
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
  const label = typeof children === "string" ? children.trim().replace(/^\+\s*/, "") : children;

  return (
    <button
      type={type}
      className={`group ${uiInlineRow} w-full justify-center rounded border border-red-500/70 bg-red-950/20 py-2.5 text-sm text-red-400 transition hover:border-red-400 hover:bg-red-950/35 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 lg:text-base ${uiPickerPressFeedback(!props.disabled)} ${className}`.trim()}
      {...props}
    >
      <PlusIcon className="h-4 w-4 shrink-0" />
      <span className="font-bold capitalize" style={{ WebkitTextStroke: "0.35px currentColor" }}>
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
  /** True when the filtered list is empty: renders the empty-state message. */
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
  recordComponentRender("PickerModal");
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
        <div className={`px-4 lg:px-5 py-2 lg:py-3 border-b ${colourDivider}`}>
          <input
            type="search"
            name="picker-search"
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
        <div
          className={`px-4 lg:px-5 py-2 lg:py-3 border-b ${colourDivider} ${uiChipRow} justify-center`}
        >
          {filterRow}
        </div>
      )}

      {/* Scrollable list */}
      <div
        ref={listRef}
        onScroll={
          scrollPositionRef
            ? (event) => {
                scrollPositionRef.current = event.currentTarget.scrollTop;
              }
            : undefined
        }
        className="min-h-0 overflow-y-auto flex-1"
      >
        {isEmpty && (
          <p className={`p-4 lg:p-5 text-sm lg:text-base ${uiTextPlaceholder} text-center`}>
            {emptyMessage}
          </p>
        )}
        {children}
      </div>

      {/* Optional footer (e.g. "+ Add custom" button or specialisation form) */}
      {footer && (
        <div className={`px-4 lg:px-5 py-3 lg:py-4 border-t ${colourDivider}`}>{footer}</div>
      )}
    </ModalShell>
  );
}
