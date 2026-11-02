// src/pages/CharacterSheet/GearTab/ItemRow.tsx

import type { ReactNode } from "react";
import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { entryNotesLine } from "../../../ui/entryNotesLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props extends CustomItemLibraryActionProps<"gear"> {
  item: GearItem;
  editable: boolean;
  onRemove: () => void | Promise<boolean | void>;
  /** Drawn in a picker: a closed card that `onSelect` chooses. */
  preview?: boolean;
  onSelect?: () => void | Promise<unknown>;
  /** A picker-only note inside the opened card, such as "Cost assigned on add". */
  previewNote?: ReactNode;
}

export function ItemRow({
  item,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
  preview,
  onSelect,
  previewNote,
}: Props) {
  recordComponentRender(preview ? "GearItemPreviewRow" : "GearItemRow");
  const description = item.description?.trim();
  const rules = item.rules?.trim();

  // Fall back to reference data for items saved before weight/value/availability were stored
  const ref = item.referenceId ? GEAR_REFERENCE.find((r) => r.id === item.referenceId) : undefined;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      collapsible
      preview={preview}
      onSelect={onSelect}
      information={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
      chips={
        <>
          <ItemMetaChips
            bare
            weight={weight}
            value={value}
            availability={availability}
            source={item.source}
            assignedLater={preview}
          />
          {previewNote}
        </>
      }
      lines={{
        rules: {
          info: rules ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<InfoParagraph>{rules}</InfoParagraph>}
            />
          ) : undefined,
        },
        notes: entryNotesLine(item.name, item.itemNotes, {
          collection: "gear",
          id: item.id,
          notes: item.personalNotes,
          editable,
        }),
        gainedFrom: item.grantedByTalentName
          ? `${item.grantedByTalentName} (${item.grantedByType})`
          : undefined,
      }}
      library={{
        libraryItem,
        isDM,
        canEditDefinition,
        busyAction,
        onEditDefinition,
        onPublish,
        onArchive,
        onUpdateAllCopies,
      }}
      removal={{ kind: "Gear Item", onRemove, hidden: Boolean(item.grantedByTalentEntryUid) }}
    />
  );
}
