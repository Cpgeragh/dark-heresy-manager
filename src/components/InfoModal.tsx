// src/components/InfoModal.tsx

import { useState } from "react";
import type { ReactNode } from "react";
import { CloseButton } from "../ui/buttons/CloseButton";
import { InfoIcon } from "../ui/icons/InfoIcon";
import { ModalHeader } from "../ui/modals/ModalHeader";
import { ModalShell } from "../ui/modals/ModalShell";
import { uiInfoButton } from "../ui/styles/buttonStyles";
import { uiTextBody } from "../ui/styles/editableStyles";
import { colourFillPanel } from "../ui/styles/colourTokens";

interface InfoModalProps {
  title: string;
  content: ReactNode;
  hideTitle?: boolean;
  as?: "button" | "span";
}

export function InfoModal({ title, content, hideTitle = false, as = "button" }: InfoModalProps) {
  const [open, setOpen] = useState(false);

  const triggerClassName = `inline-flex h-3.5 w-[18px] shrink-0 items-center justify-center text-sm leading-none transform-gpu ${uiInfoButton}`;
  const triggerIcon = <InfoIcon className="h-2.5 w-2.5" />;

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
              className={`sticky top-0 ${colourFillPanel}`}
            />
          )}
          <div
            className={`px-4 lg:px-5 py-3 lg:py-4 text-sm lg:text-base ${uiTextBody} space-y-1.5 lg:space-y-2`}
          >
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
