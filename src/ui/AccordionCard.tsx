// src/ui/AccordionCard.tsx

import type { ReactNode } from "react";
import { ExpandChevron } from "./icons/ExpandChevron";
import { uiFocusRing, uiHoverSurface, uiPressFeedback } from "./styles/buttonStyles";
import { uiSectionShell } from "./styles/editableStyles";
import { CharacterEntryRowContent } from "./CharacterEntryRow";

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
        className={`group w-full p-3 text-left transition ${uiHoverSurface} lg:p-4 ${uiPressFeedback()} ${uiFocusRing}`}
      >
        <CharacterEntryRowContent
          name={header}
          nameClassName=""
          actions={showChevron ? <ExpandChevron expanded={expanded} /> : undefined}
        />
      </button>
      {children}
    </div>
  );
}
