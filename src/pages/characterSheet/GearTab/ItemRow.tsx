// src/pages/characterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: GearItem;
  editable: boolean;
  onRemove: () => void;
}

export function ItemRow({ item, editable, onRemove }: Props) {
  const hasDesc = !!(item.description?.trim());

  // Fall back to reference data for items saved before weight/value/rarity were stored
  const ref = item.referenceId
    ? GEAR_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;
  const weight = item.weight ?? ref?.weight;
  const value  = item.value  ?? ref?.value;
  const rarity = item.rarity ?? ref?.rarity;

  return (
    <div className={sectionContainerClass(editable)}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200">{item.name}</p>
            {hasDesc && (
              <InfoModal
                title={item.name}
                content={<p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>}
              />
            )}
          </div>
          <ItemMetaChips
            weight={weight} value={value} rarity={rarity} source={item.source}
            className="flex flex-wrap gap-1.5 mt-1"
          />
        </div>

        {editable && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
