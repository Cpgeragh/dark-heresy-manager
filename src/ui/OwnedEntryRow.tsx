import type { ReactNode } from "react";
import { InfoModal } from "../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../types/CustomItemActions";
import { StatusBadge } from "./chips/StatusBadge";
import { CharacterEntryRow } from "./CharacterEntryRow";
import { EntryDetailLine } from "./EntryDetailLine";
import { CustomItemActionButtons } from "./forms/CustomItemActionButtons";
import { RemoveEntryButton, type RemoveEntryExtra } from "./RemoveEntryButton";
import { uiChipRow } from "./styles/editableStyles";

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

interface EntryLine {
  value?: ReactNode;
  info?: ReactNode;
}

/** The labelled lines of an owned entry. A line the caller supplies shows a dash when it is empty. */
export interface OwnedEntryLines {
  craftsmanship?: EntryLine;
  duration?: EntryLine;
  qualities?: EntryLine;
  rules?: EntryLine;
  gainedFrom?: string;
  talentEffects?: string;
  notes?: string;
}

export interface OwnedEntryRemoval {
  kind: OwnedEntryKind;
  onRemove: () => unknown;
  hidden?: boolean;
  blockedMessage?: string;
  extra?: RemoveEntryExtra;
}

interface OwnedEntryRowProps {
  name: string;
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
}

/** One owned entry on a character sheet: the same layout for every kind, with only the content changing. */
export function OwnedEntryRow({
  name,
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
}: OwnedEntryRowProps) {
  const libraryItem = library?.libraryItem;
  return (
    <CharacterEntryRow
      name={name}
      inactive={inactive}
      tone={tone}
      actions={actions}
      badge={
        <>
          {libraryItem && <StatusBadge status={libraryItem.status} />}
          {badge}
        </>
      }
      info={<InfoModal title={name} content={information} as={informationAs} />}
      metadata={
        chips ? (
          <div className={`${uiChipRow} items-center [&>*]:shrink-0`}>{chips}</div>
        ) : undefined
      }
      afterMetadata={
        <>
          {lines?.craftsmanship && (
            <EntryDetailLine label="Craftsmanship" {...lines.craftsmanship} />
          )}
          {lines?.duration && <EntryDetailLine label="Duration" {...lines.duration} />}
          {lines?.qualities && <EntryDetailLine label="Qualities" {...lines.qualities} />}
          {lines?.rules && <EntryDetailLine label="Rules" {...lines.rules} />}
          {lines?.gainedFrom && <EntryDetailLine label="Gained from" value={lines.gainedFrom} />}
          {lines?.talentEffects && (
            <EntryDetailLine label="Talent effects" value={lines.talentEffects} />
          )}
          {lines?.notes && <EntryDetailLine label="Notes" value={lines.notes} />}
        </>
      }
      removeAction={
        editable && removal && !removal.hidden ? (
          <RemoveEntryButton
            kind={removal.kind}
            name={name}
            onRemove={removal.onRemove}
            blockedMessage={removal.blockedMessage}
            extra={removal.extra}
          />
        ) : undefined
      }
    >
      {body}
      {library?.libraryItem && (
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
      )}
    </CharacterEntryRow>
  );
}
