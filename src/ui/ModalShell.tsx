// Shared behavioural and visual foundation for centred modal dialogs.
// Drawers, popovers, and other non-modal overlays intentionally remain separate.

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

interface ViewportState {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getViewportState(): ViewportState | null {
  if (typeof window === "undefined") return null;

  const visualViewport = window.visualViewport;
  return visualViewport
    ? {
        top: visualViewport.offsetTop,
        left: visualViewport.offsetLeft,
        width: visualViewport.width,
        height: visualViewport.height,
      }
    : {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
}

function useVisualViewport(enabled: boolean) {
  const [viewport, setViewport] = useState<ViewportState | null>(() =>
    enabled ? getViewportState() : null
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const update = () => setViewport(getViewportState());
    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return viewport;
}

let modalScrollLockCount = 0;
let previousBodyOverflow = "";

function useBodyScrollLock() {
  useEffect(() => {
    if (modalScrollLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    modalScrollLockCount += 1;

    return () => {
      modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);
      if (modalScrollLockCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }
    };
  }, []);
}

interface ModalShellProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  onClose: () => void;
  style?: CSSProperties;
  viewportAware?: boolean;
}

export function ModalShell({
  ariaLabel,
  children,
  className = "",
  closeOnBackdrop = true,
  onClose,
  style,
  viewportAware = false,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const unmountingRef = useRef(false);
  const viewport = useVisualViewport(viewportAware);

  useBodyScrollLock();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => {
      unmountingRef.current = true;
      if (dialog.open) dialog.close();
    };
  }, []);

  const useVisibleViewport =
    viewportAware &&
    viewport !== null &&
    typeof window !== "undefined" &&
    (viewport.top !== 0 ||
      viewport.left !== 0 ||
      viewport.width < window.innerWidth ||
      viewport.height < window.innerHeight);

  const viewportStyle: CSSProperties | undefined = useVisibleViewport
    ? {
        position: "fixed",
        margin: 0,
        top: viewport.top + viewport.height / 2,
        left: viewport.left + viewport.width / 2,
        width: Math.max(0, viewport.width - 32),
        maxHeight: Math.max(0, viewport.height - 32),
        transform: "translate(-50%, -50%)",
      }
    : undefined;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={ariaLabel}
      aria-modal="true"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
      onClose={() => {
        if (!unmountingRef.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 text-slate-200 backdrop:bg-black/70 backdrop:backdrop-blur-sm ${className}`.trim()}
      style={{ ...style, ...viewportStyle }}
    >
      {children}
    </dialog>,
    document.body
  );
}
