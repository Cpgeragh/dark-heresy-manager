// src/components/InfoModal.tsx

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface InfoModalProps {
  title: string;
  content: ReactNode;
}

export function InfoModal({ title, content }: InfoModalProps) {
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
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={`Show information about ${title}`}
        className="inline-flex h-6 w-9 shrink-0 items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 text-sm leading-none hover:bg-slate-600"
      >
        <span className="relative -top-px">{"\u24D8"}</span>
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onClose={() => setOpen(false)}
        className="w-[90vw] max-w-sm max-h-[70vh] overflow-y-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl p-0 text-slate-200 backdrop:bg-black/60"
      >
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
        <div className="px-4 py-3 text-sm text-slate-300 space-y-1.5">
          {content}
        </div>
      </dialog>
    </>
  );
}
