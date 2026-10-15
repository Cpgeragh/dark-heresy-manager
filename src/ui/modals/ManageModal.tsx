// src/ui/modals/ManageModal.tsx
// The settings window opened by a gear button: a header, then one ManageActionRow per action.

import type { ReactNode } from "react";
import { colourDivideList } from "../styles/colourTokens";
import { PendingOverlay } from "../PendingOverlay";
import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

interface ManageModalProps {
  title: string;
  ariaLabel: string;
  onClose: () => void;
  /** Hides the window behind another one that was opened from it. */
  suspended?: boolean;
  /** Covers the window with the loading overlay while an action prepares. */
  pending?: boolean;
  children: ReactNode;
}

export function ManageModal({
  title,
  ariaLabel,
  onClose,
  suspended = false,
  pending = false,
  children,
}: ManageModalProps) {
  return (
    <ModalShell
      ariaLabel={ariaLabel}
      onClose={onClose}
      suspended={suspended}
      className="relative min-h-0 max-h-[85vh] max-w-md flex flex-col overflow-hidden"
      viewportAware
    >
      <ModalHeader title={title} onClose={onClose} />
      <div className={`min-h-0 flex-1 divide-y ${colourDivideList} overflow-y-auto px-4 lg:px-6`}>
        {children}
      </div>
      <PendingOverlay active={pending} />
    </ModalShell>
  );
}
