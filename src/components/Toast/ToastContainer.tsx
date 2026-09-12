// src/components/Toast/ToastContainer.tsx

import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState } from "react";
import { MODAL_LAYER_CHANGED_EVENT, MODAL_OPENED_EVENT } from "../../ui/modals/ModalShell";
import { useToasts } from "./ToastContext";
import { ToastItem } from "./ToastItem";

export function ToastContainer() {
  const toasts = useToasts();
  const hasToasts = toasts.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement>(() => document.body);

  useLayoutEffect(() => {
    let active = true;
    const updatePortalTarget = () => {
      queueMicrotask(() => {
        if (!active) return;
        const openModals = Array.from(
          document.querySelectorAll<HTMLDialogElement>(
            'dialog[data-modal-shell="true"][open]:not([data-modal-suspended="true"])'
          )
        );
        setPortalTarget(openModals.at(-1) ?? document.body);
      });
    };

    updatePortalTarget();
    window.addEventListener(MODAL_LAYER_CHANGED_EVENT, updatePortalTarget);
    return () => {
      active = false;
      window.removeEventListener(MODAL_LAYER_CHANGED_EVENT, updatePortalTarget);
    };
  }, [hasToasts]);

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

      // Some environments expose the methods without implementing the top
      // layer. Leaving the attribute in place there makes the toast hidden.
      try {
        if (!container.matches(":popover-open")) container.removeAttribute("popover");
      } catch {
        container.removeAttribute("popover");
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
  }, [hasToasts, portalTarget]);

  if (!hasToasts) return null;

  return createPortal(
    <div
      ref={containerRef}
      popover="manual"
      className="fixed bottom-4 left-1/2 right-auto top-auto z-50 m-0 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 overflow-visible border-0 bg-transparent p-0 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    portalTarget
  );
}
