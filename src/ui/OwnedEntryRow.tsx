import { useState, type ReactNode } from "react";
import { InfoModal } from "../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../types/CustomItemActions";
import { StatusBadge } from "./chips/StatusBadge";
import { AccordionCard } from "./AccordionCard";
import { CharacterEntryRow } from "./CharacterEntryRow";
import { EntryLines, type EntryLine, type OwnedEntryLines } from "./EntryLines";
import { CustomItemActionButtons } from "./forms/CustomItemActionButtons";
import { RemoveEntryButton, type RemoveEntryExtra } from "./RemoveEntryButton";
import { uiChipRow, uiInlineRow, uiStackField } from "./styles/editableStyles";
import { uiLayerLocal } from "./styles/layerStyles";

export type OwnedEntryKind =
  | "Skill"
  | "Talent"
  | "Trait"
  | "Elite Advance"
  | "Mutation"
  | "Malignancy"
  | "Disorder"
  | "Trauma"
  | "Gear Item"
  | "Consumable"
  | "Drug"
  | "Implant"
  | "Armour Piece"
  | "Force Field"
  | "Archeotech Item";

export type { EntryLine, OwnedEntryLines };

export interface OwnedEntryRemoval {
  kind: OwnedEntryKind;
  onRemove: () => unknown;
  hidden?: boolean;
  blockedMessage?: string;
  extra?: RemoveEntryExtra;
}

interface OwnedEntryRowProps {
  name: string;
  /** The name shown in the row when it differs from `name`, which still serves the information window and the Remove pop-up. */
  displayName?: string;
  editable: boolean;
  /** The content of the information icon, which is always shown. */
  information?: ReactNode;
  informationAs?: "button" | "span";
  badge?: ReactNode;
  /** The chips of the entry; the row draws the one chip row around them. */
  chips?: ReactNode;
  lines?: OwnedEntryLines;
  actions?: ReactNode;
  removal?: OwnedEntryRemoval;
  library?: CustomItemLibraryActionProps;
  inactive?: boolean;
  tone?: "default" | "archeotech";
  /** Extra content below the lines, such as Upgrades or Spare Cells. */
  body?: ReactNode;
  /** Draws the entry as a closed card that opens to show its chips and lines. */
  collapsible?: boolean;
  /** Keeps a collapsible entry open, with no chevron, where every detail must show. */
  forceExpanded?: boolean;
}

/** One owned entry on a character sheet: the same layout for every kind, with only the content changing. */
export function OwnedEntryRow({
  name,
  displayName,
  editable,
  information,
  informationAs,
  badge,
  chips,
  lines,
  actions,
  removal,
  library,
  inactive,
  tone,
  body,
  collapsible = false,
  forceExpanded = false,
}: OwnedEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const libraryItem = library?.libraryItem;
  const badges = (
    <>
      {libraryItem && <StatusBadge status={libraryItem.status} />}
      {badge}
    </>
  );
  const info = <InfoModal title={name} content={information} as={informationAs} />;
  const chipRow = chips ? (
    <div className={`${uiChipRow} items-center empty:hidden [&>*]:shrink-0`}>{chips}</div>
  ) : undefined;
  const labelledLines = lines ? <EntryLines lines={lines} /> : undefined;
  const removeButton =
    editable && removal && !removal.hidden ? (
      <RemoveEntryButton
        kind={removal.kind}
        name={name}
        onRemove={removal.onRemove}
        blockedMessage={removal.blockedMessage}
        extra={removal.extra}
      />
    ) : undefined;
  const libraryButtons = library?.libraryItem ? (
    <CustomItemActionButtons
      libraryItem={library.libraryItem}
      isDM={library.isDM ?? false}
      canEditDefinition={library.canEditDefinition ?? false}
      busyAction={library.busyAction}
      onEditDefinition={library.onEditDefinition}
      onPublish={library.onPublish}
      onArchive={library.onArchive}
      onUpdateAllCopies={library.onUpdateAllCopies}
    />
  ) : undefined;

  if (collapsible) {
    return (
      <AccordionCard
        name={displayName ?? name}
        label={name}
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
        forceExpanded={forceExpanded}
        tone={tone === "archeotech" ? "amber" : "default"}
        inactive={inactive}
        badge={badges}
        info={info}
        removeAction={removeButton}
        actions={
          actions ? (
            <div className={`${uiInlineRow} relative ${uiLayerLocal} pointer-events-auto`}>
              {actions}
            </div>
          ) : undefined
        }
      >
        {chipRow}
        <div className={`${uiStackField} empty:hidden`}>{labelledLines}</div>
        {body}
        {libraryButtons}
      </AccordionCard>
    );
  }

  return (
    <CharacterEntryRow
      name={displayName ?? name}
      inactive={inactive}
      tone={tone}
      actions={actions}
      badge={badges}
      info={info}
      metadata={chipRow}
      afterMetadata={labelledLines}
      removeAction={removeButton}
    >
      {body}
      {libraryButtons}
    </CharacterEntryRow>
  );
}
