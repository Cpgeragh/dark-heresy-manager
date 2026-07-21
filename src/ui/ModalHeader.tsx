// Shared centred header for modal dialogs.

import type { ReactNode } from "react";
import { CloseButton } from "./CloseButton";

interface ModalHeaderProps {
  action?: ReactNode;
  actionAriaLabel?: string;
  className?: string;
  onClose: () => void;
  title: ReactNode;
  titleClassName?: string;
}

export function ModalHeader({
  action,
  actionAriaLabel = "Back",
  className = "",
  onClose,
  title,
  titleClassName,
}: ModalHeaderProps) {
  return (
    <div
      className={`grid grid-cols-[2rem_1fr_2rem] items-center px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700 ${className}`.trim()}
    >
      <span aria-hidden />
      <h2
        className={`text-center text-sm lg:text-base font-cinzel font-bold ${
          titleClassName ?? "text-red-500"
        }`}
      >
        {title}
      </h2>
      {action === undefined ? (
        <CloseButton onClick={onClose} className="justify-self-end" />
      ) : (
        <button
          type="button"
          onClick={onClose}
          aria-label={actionAriaLabel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center justify-self-end rounded-lg text-lg lg:text-xl text-slate-400 hover:text-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {action}
        </button>
      )}
    </div>
  );
}
