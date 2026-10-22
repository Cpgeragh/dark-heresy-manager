// src/pages/CharacterSheet/GearTab/ConsumableRow.tsx

import type { ConsumableItem } from "../../../types/Character";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
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
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      information={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
      chips={
        <ItemMetaChips
          bare
          weight={item.weight}
          value={item.value}
          availability={item.availability}
          source={item.source}
        />
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
