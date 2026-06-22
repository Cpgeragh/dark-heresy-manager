// src/pages/characterSheet/GearTab/ConsumableRow.tsx

import type { ConsumableItem } from "../../../types/Character";
import { uiSection, uiTextBody, uiTextLabel } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: ConsumableItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function ConsumableRow({ item, editable, onUpdateQty, onRemove }: Props) {
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
            <p className="text-sm lg:text-base font-medium text-slate-200">{item.name}</p>
            {hasDesc && (
              <span className="inline-flex items-center -translate-y-[1.4px]">
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
            rarity={item.rarity}
            source={item.source}
            className="flex flex-wrap gap-1.5 mt-1"
          />
        </div>

        {editable && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-xs lg:text-sm text-red-400 hover:text-red-300 transition shrink-0"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
