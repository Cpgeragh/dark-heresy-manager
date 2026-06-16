// src/components/InfoModal.tsx

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface InfoModalProps {
  title: string;
  content: ReactNode;
  hideTitle?: boolean;
}

export function InfoModal({ title, content, hideTitle = false }: InfoModalProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setOpen(false);
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Show information about ${title}`}
        className="inline-flex h-[13.5px] w-[18px] shrink-0 my-auto md:translate-y-[1px] items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 text-sm leading-none hover:bg-slate-600"
      >
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
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onClose={() => setOpen(false)}
        className="w-[90vw] max-w-sm max-h-[70vh] overflow-y-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl p-0 text-slate-200 backdrop:bg-black/60 whitespace-normal"
      >
        {!hideTitle && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 sticky top-0 bg-slate-800">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-200 text-base leading-none ml-4"
            >
              {"\u00D7"}
            </button>
          </div>
        )}
        <div className="px-4 py-3 text-sm text-slate-300 space-y-1.5">
          {hideTitle && (
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="float-right ml-3 mb-1 text-slate-400 hover:text-slate-200 text-base leading-none"
            >
              {"\u00D7"}
            </button>
          )}
          {content}
        </div>
      </dialog>
    </>
  );
}
