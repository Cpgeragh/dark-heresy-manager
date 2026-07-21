// src/components/InfoModal.tsx

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { CloseButton } from "../ui/CloseButton";

interface InfoModalProps {
  title: string;
  content: ReactNode;
  hideTitle?: boolean;
  as?: "button" | "span";
}

export function InfoModal({ title, content, hideTitle = false, as = "button" }: InfoModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setOpen(false);
  }

  const triggerClassName = "inline-flex h-[13.5px] w-[18px] shrink-0 items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 text-sm leading-none hover:bg-slate-600";
  const triggerIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-2.5 h-2.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );

  return (
    <>
      {as === "span" ? (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }
          }}
          aria-label={`Show information about ${title}`}
          className={triggerClassName}
        >
          {triggerIcon}
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          aria-label={`Show information about ${title}`}
          className={triggerClassName}
        >
          {triggerIcon}
        </button>
      )}

      {createPortal(
        <dialog
          ref={dialogRef}
          onClick={handleBackdropClick}
          onClose={() => setOpen(false)}
          className="w-[90vw] max-w-sm lg:max-w-2xl max-h-[70vh] lg:max-h-[85vh] overflow-y-auto rounded-xl bg-slate-900 border border-slate-500 shadow-xl p-0 text-slate-200 backdrop:bg-black/50 backdrop:backdrop-blur-sm whitespace-normal"
        >
          {!hideTitle && (
            <div className="grid grid-cols-[2rem_1fr_2rem] items-center px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700 sticky top-0 bg-slate-900">
              <span aria-hidden />
              <h3 className="text-center text-sm lg:text-base font-cinzel font-semibold text-red-500">{title}</h3>
              <CloseButton
                onClick={() => setOpen(false)}
                className="justify-self-end"
              />
            </div>
          )}
          <div className="px-4 lg:px-5 py-3 lg:py-4 text-sm lg:text-base text-slate-300 space-y-1.5 lg:space-y-2">
            {hideTitle && (
              <CloseButton
                onClick={() => setOpen(false)}
                className="float-right ml-3 mb-1"
              />
            )}
            {content}
          </div>
        </dialog>,
        document.body
      )}
    </>
  );
}
