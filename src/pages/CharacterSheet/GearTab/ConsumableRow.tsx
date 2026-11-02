// src/pages/CharacterSheet/GearTab/ConsumableRow.tsx

import type { ReactNode } from "react";
import type { ConsumableItem } from "../../../types/Character";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { entryNotesLine } from "../../../ui/entryNotesLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props extends CustomItemLibraryActionProps<"consumable"> {
  item: ConsumableItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void | Promise<boolean | void>;
  /** Drawn in a picker: a closed card that `onSelect` chooses. */
  preview?: boolean;
  onSelect?: () => void | Promise<unknown>;
  /** A picker-only note inside the opened card, such as "Cost assigned on add". */
  previewNote?: ReactNode;
}

export function ConsumableRow({
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
  onUpdateQty,
  onRemove,
  preview,
  onSelect,
  previewNote,
}: Props) {
  recordComponentRender(preview ? "ConsumablePreviewRow" : "ConsumableRow");
  const description = item.description?.trim();
  const rules = item.rules?.trim();

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
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
          />
          {previewNote}
        </>
      }
      lines={{
        notes: entryNotesLine(item.name, item.itemNotes, {
          collection: "consumables",
          id: item.id,
          notes: item.personalNotes,
          editable,
        }),
        rules: {
          info: rules ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<InfoParagraph>{rules}</InfoParagraph>}
            />
          ) : undefined,
        },
      }}
      actions={
        <QuantityControl
          quantity={item.quantity}
          editable={editable}
          onUpdate={(q) => onUpdateQty(item.id, q)}
        />
      }
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
      removal={{ kind: "Consumable", onRemove: () => onRemove(item.id) }}
    />
  );
}
