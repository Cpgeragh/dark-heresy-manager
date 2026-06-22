// src/ui/PickerModal.tsx
// Shared shell for reference-picker modals: backdrop, header, search input, scrollable list.

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { editableInputClass } from "./editableStyles";

function getViewportState() {
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function useVisualViewport() {
  const [viewport, setViewport] = useState(getViewportState);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      const update = () => setViewport(getViewportState());
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const update = () => {
      setViewport({
        top: visualViewport.offsetTop,
        left: visualViewport.offsetLeft,
        width: visualViewport.width,
        height: visualViewport.height,
      });
    };

    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, []);

  return viewport;
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
  /** Override the container max-height. Defaults to "max-h-[85vh]". */
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
  titleClassName,
  closeLabel = "×",
  hideSearch = false,
  filterRow,
  footer,
  maxHeight = "max-h-[85vh]",
  children,
}: Props) {
  const viewport = useVisualViewport();
  const useVisibleViewport =
    viewport.width < window.innerWidth || viewport.height < window.innerHeight;
  const modalMaxHeight = Math.max(0, viewport.height - 32);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      style={
        useVisibleViewport
          ? {
              top: viewport.top,
              left: viewport.left,
              right: "auto",
              bottom: "auto",
              width: viewport.width,
              height: viewport.height,
            }
          : undefined
      }
      onClick={onClose}
    >
      <div
        className={`w-full min-h-0 max-w-lg lg:max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden ${maxHeight}`}
        style={{ maxHeight: useVisibleViewport ? modalMaxHeight : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_2rem] items-center px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <span aria-hidden />
          <h3 className={`text-center text-sm lg:text-base font-cinzel font-bold ${titleClassName ?? "text-red-500"}`}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="justify-self-end text-slate-400 hover:text-slate-200 text-lg lg:text-xl leading-none"
          >
            {closeLabel}
          </button>
        </div>

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
          <div className="px-4 lg:px-5 py-2 lg:py-3 border-b border-slate-800 flex flex-wrap gap-1.5">
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
      </div>
    </div>,
    document.body
  );
}
