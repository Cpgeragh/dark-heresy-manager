// src/components/InfoModal.tsx

import { useState } from "react";
import type { ReactNode } from "react";
import { CloseButton } from "../ui/buttons/CloseButton";
import { ModalHeader } from "../ui/modals/ModalHeader";
import { ModalShell } from "../ui/modals/ModalShell";

interface InfoModalProps {
  title: string;
  content: ReactNode;
  hideTitle?: boolean;
  as?: "button" | "span";
}

export function InfoModal({ title, content, hideTitle = false, as = "button" }: InfoModalProps) {
  const [open, setOpen] = useState(false);

  const triggerClassName =
    "inline-flex h-[13.5px] w-[18px] shrink-0 items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 text-sm leading-none hover:bg-slate-600";
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
          type="button"
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

      {open && (
        <ModalShell
          ariaLabel={title}
          onClose={() => setOpen(false)}
          className="max-w-sm lg:max-w-2xl max-h-[70vh] lg:max-h-[85vh] overflow-y-auto whitespace-normal"
        >
          {!hideTitle && (
            <ModalHeader
              title={title}
              onClose={() => setOpen(false)}
              className="sticky top-0 bg-slate-900"
            />
          )}
          <div className="px-4 lg:px-5 py-3 lg:py-4 text-sm lg:text-base text-slate-300 space-y-1.5 lg:space-y-2">
            {hideTitle && (
              <CloseButton onClick={() => setOpen(false)} className="float-right ml-3 mb-1" />
            )}
            {content}
          </div>
        </ModalShell>
      )}
    </>
  );
}
