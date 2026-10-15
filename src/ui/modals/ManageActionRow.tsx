// src/ui/modals/ManageActionRow.tsx
// One row in a ManageModal: a bold label with an info icon, and the action button on the right.

import type { ReactNode } from "react";
import { InfoModal } from "../../components/InfoModal";
import { uiActionRowLabel } from "../styles/editableStyles";

interface ManageActionRowProps {
  label: string;
  info: string;
  /** The icon button for this action. */
  children?: ReactNode;
  /** Extra content under the label, such as a revealed code or a confirmation. */
  detail?: ReactNode;
}

export function ManageActionRow({ label, info, children, detail }: ManageActionRowProps) {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 lg:py-5">
      <div className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={uiActionRowLabel}>{label}</span>
          <InfoModal title={label} content={info} />
        </span>
        {detail}
      </div>
      <div className="justify-self-end">{children}</div>
    </section>
  );
}
