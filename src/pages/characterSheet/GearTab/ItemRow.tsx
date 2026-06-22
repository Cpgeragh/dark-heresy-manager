// src/pages/characterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: GearItem;
  editable: boolean;
  onRemove: () => void;
}

export function ItemRow({ item, editable, onRemove }: Props) {
  const hasDesc = !!item.description?.trim();

  // Fall back to reference data for items saved before weight/value/availability were stored
  const ref = item.referenceId ? GEAR_REFERENCE.find((r) => r.id === item.referenceId) : undefined;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm lg:text-base font-medium text-slate-200">{item.name}</p>
            {hasDesc && (
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal
                  title={item.name}
                  content={
                    <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                  }
                />
              </span>
            )}
          </div>
          <ItemMetaChips
            weight={weight}
            value={value}
            availability={availability}
            source={item.source}
            className="flex flex-wrap gap-1.5 mt-1"
          />
        </div>

        {editable && (
          <button
            onClick={onRemove}
            className="text-xs lg:text-sm text-red-400 hover:text-red-300 transition shrink-0"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
