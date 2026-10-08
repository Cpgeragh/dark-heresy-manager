// src/ui/AccordionCard.tsx

import type { ReactNode } from "react";
import { ExpandChevron } from "./icons/ExpandChevron";
import { uiPickerPressFeedback } from "./styles/buttonStyles";
import { uiSectionShell } from "./styles/editableStyles";

interface AccordionCardProps {
  expanded: boolean;
  onToggle: () => void;
  header: ReactNode;
  children?: ReactNode;
  showChevron?: boolean;
  shellClassName?: string;
  "aria-label"?: string;
  "aria-controls"?: string;
}

/** A card whose header button expands and collapses the content beneath it. */
export function AccordionCard({
  expanded,
  onToggle,
  header,
  children,
  showChevron = true,
  shellClassName = uiSectionShell,
  ...aria
}: AccordionCardProps) {
  return (
    <div className={`${shellClassName} overflow-hidden`.trim()}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        {...aria}
        className={`group flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-800 lg:p-4 ${uiPickerPressFeedback(true)}`}
      >
        <div className="min-w-0 flex-1">{header}</div>
        {showChevron && <ExpandChevron expanded={expanded} />}
      </button>
      {children}
    </div>
  );
}
