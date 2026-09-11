// src/components/Toast/ToastContainer.tsx

import { useLayoutEffect, useRef } from "react";
import { MODAL_OPENED_EVENT } from "../../ui/modals/ModalShell";
import { useToasts } from "./ToastContext";
import { ToastItem } from "./ToastItem";

export function ToastContainer() {
  const toasts = useToasts();
  const hasToasts = toasts.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof container.showPopover !== "function") return;

    const raiseAboveModals = () => {
      // Reopening moves an existing toast layer above a newly opened native dialog.
      try {
        container.hidePopover();
      } catch {
        // The popover is not open yet.
      }
      try {
        container.showPopover();
      } catch {
        // Retain the normal fixed-position fallback in browsers without usable popovers.
      }
    };

    raiseAboveModals();
    window.addEventListener(MODAL_OPENED_EVENT, raiseAboveModals);
    return () => {
      window.removeEventListener(MODAL_OPENED_EVENT, raiseAboveModals);
      try {
        container.hidePopover();
      } catch {
        // The browser may already have closed it.
      }
    };
  }, [hasToasts]);

  if (!hasToasts) return null;

  return (
    <div
      ref={containerRef}
      popover="manual"
      className="fixed bottom-4 left-1/2 right-auto top-auto z-50 m-0 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 overflow-visible border-0 bg-transparent p-0 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
