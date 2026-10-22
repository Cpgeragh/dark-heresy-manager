// src/ui/AccordionCard.tsx

import type { MouseEvent, ReactNode } from "react";
import { CardOverlayButton } from "./buttons/CardOverlayButton";
import { ExpandButton } from "./buttons/ExpandButton";
import { CharacterEntryRowContent } from "./CharacterEntryRow";
import { ExpandChevron } from "./icons/ExpandChevron";
import { uiCardTapHeader } from "./styles/buttonStyles";
import { colourNoticeAmber, colourNoticePink, colourNoticeRed } from "./styles/colourTokens";
import {
  uiNoticeBox,
  uiOverlayItemNameHover,
  uiSectionShell,
  uiSpinner,
  uiStackSection,
} from "./styles/editableStyles";
import { uiLayerLocal } from "./styles/layerStyles";
import { usePendingClick } from "./usePendingClick";

const CARD_SHELL = {
  default: uiSectionShell,
  amber: `${uiNoticeBox} ${colourNoticeAmber}`,
  pink: `${uiNoticeBox} ${colourNoticePink}`,
  red: `${uiNoticeBox} ${colourNoticeRed}`,
} as const;

interface AccordionCardProps {
  name: ReactNode;
  /** Plain text for the accessible name, read as "Expand <label> details". */
  label: string;
  expanded: boolean;
  onToggle: () => void;
  tone?: keyof typeof CARD_SHELL;
  badge?: ReactNode;
  info?: ReactNode;
  metadata?: ReactNode;
  removeAction?: ReactNode;
  actions?: ReactNode;
  /** In a picker a tap on the card chooses it, and the chevron button expands it. */
  onSelect?: () => void | Promise<unknown>;
  selectLabel?: string;
  /** Shows the body with no overlay button and no chevron. */
  forceExpanded?: boolean;
  bodyId?: string;
  children?: ReactNode;
}

/** The one expandable card: a tappable header holding the shared entry row, and a body beneath it. */
export function AccordionCard({
  name,
  label,
  expanded,
  onToggle,
  tone = "default",
  badge,
  info,
  metadata,
  removeAction,
  actions,
  onSelect,
  selectLabel,
  forceExpanded = false,
  bodyId,
  children,
}: AccordionCardProps) {
  const toggleLabel = `${expanded ? "Collapse" : "Expand"} ${label} details`;
  const open = expanded || forceExpanded;
  const { pending: selecting, handleClick: handleSelect } = usePendingClick(
    onSelect ? (_event: MouseEvent<HTMLButtonElement>) => onSelect() : undefined
  );

  return (
    <div className={`${CARD_SHELL[tone]} overflow-hidden`}>
      <div className={`${forceExpanded ? "" : uiCardTapHeader} relative w-full p-3 lg:p-4`}>
        {!forceExpanded && (
          <CardOverlayButton
            label={onSelect ? (selectLabel ?? `Select ${label}`) : toggleLabel}
            expanded={onSelect ? undefined : expanded}
            pending={selecting}
            aria-controls={bodyId}
            onClick={onSelect ? handleSelect : onToggle}
          />
        )}
        <CharacterEntryRowContent
          interactive
          name={name}
          nameClassName={uiOverlayItemNameHover}
          badge={badge}
          info={info}
          metadata={metadata}
          removeAction={removeAction}
          actions={actions}
          expandControl={
            forceExpanded ? undefined : onSelect ? (
              selecting ? (
                <span
                  className={`${uiSpinner} relative ${uiLayerLocal} h-4 w-4`}
                  aria-hidden="true"
                />
              ) : (
                <ExpandButton expanded={expanded} label={toggleLabel} onClick={onToggle} />
              )
            ) : (
              <ExpandChevron expanded={expanded} />
            )
          }
        />
      </div>
      {open && children && (
        <div id={bodyId} className={`px-3 pb-3 lg:px-4 lg:pb-4 ${uiStackSection}`}>
          {children}
        </div>
      )}
    </div>
  );
}
