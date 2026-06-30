// src/pages/characterSheet/GearTab/ConsumableRow.tsx

import type { ConsumableItem } from "../../../types/Character";
import { uiSection, uiTextBody, uiTextLabel, uiItemName, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";

interface Props {
  item: ConsumableItem;
  editable: boolean;
  libraryItem?: CampaignCustomItem<"consumable">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
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
  const hasDesc = !!item.description?.trim();

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center shrink-0">
          <span className={`${uiTextLabel} mb-0.5`}>Qty</span>
          <QuantityControl
            quantity={item.quantity}
            editable={editable}
            size="sm"
            onUpdate={(q) => onUpdateQty(item.id, q)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={uiItemName}>{item.name}</p>
            {libraryItem && (
              <StatusBadge status={libraryItem.status} />
            )}
            {hasDesc && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={item.name}
                  content={
                    <p className={`text-sm ${uiTextBody} leading-relaxed`}>{item.description}</p>
                  }
                />
              </span>
            )}
          </div>
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
            className="flex flex-wrap gap-1.5 mt-1"
          />
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
        </div>

        {editable && (
          <button
            onClick={() => onRemove(item.id)}
            className={`${uiActionButtonCompact} shrink-0`}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
