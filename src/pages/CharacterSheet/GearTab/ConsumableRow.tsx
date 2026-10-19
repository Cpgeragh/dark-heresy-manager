// src/pages/CharacterSheet/GearTab/ConsumableRow.tsx

import type { ConsumableItem } from "../../../types/Character";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props extends CustomItemLibraryActionProps<"consumable"> {
  item: ConsumableItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void | Promise<void>;
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
}: Props) {
  recordComponentRender("ConsumableRow");
  const description = item.description?.trim();
  const rules = item.rules?.trim();

  return (
    <CharacterEntryRow
      name={item.name}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      info={
        <InfoModal
          title={item.name}
          content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <ItemMetaChips
          weight={item.weight}
          value={item.value}
          availability={item.availability}
          source={item.source}
          className={uiChipRow}
        />
      }
      afterMetadata={
        <EntryDetailLine
          label="Rules"
          info={
            rules ? (
              <InfoModal
                title={`${item.name} Rules`}
                content={<InfoParagraph>{rules}</InfoParagraph>}
              />
            ) : undefined
          }
        />
      }
      actions={
        <QuantityControl
          quantity={item.quantity}
          editable={editable}
          onUpdate={(q) => onUpdateQty(item.id, q)}
        />
      }
      removeAction={
        editable ? (
          <RemoveEntryButton
            kind="Consumable"
            name={item.name}
            onRemove={() => onRemove(item.id)}
          />
        ) : undefined
      }
    >
      {libraryItem && (
        <CustomItemActionButtons
          libraryItem={libraryItem}
          isDM={isDM}
          canEditDefinition={canEditDefinition}
          busyAction={busyAction}
          onEditDefinition={onEditDefinition}
          onPublish={onPublish}
          onArchive={onArchive}
          onUpdateAllCopies={onUpdateAllCopies}
        />
      )}
    </CharacterEntryRow>
  );
}
