// src/pages/characterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";

export function DrugRow({
  item,
  editable,
  onUpdateQty,
  onRemove,
  onInfo,
}: {
  item: DrugItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onInfo: (item: DrugItem) => void;
}) {
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className={[sectionContainerClass(editable), "flex items-center gap-3"].join(" ")}>
      {/* Name + duration + chips */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{item.name}</p>
        {ref?.duration && (
          <p className="text-xs text-slate-500 mt-0.5">⏱ {ref.duration}</p>
        )}
        <ItemMetaChips
          value={item.value ?? ref?.value}
          rarity={item.rarity ?? ref?.rarity}
          source={item.source}
          valueAmber
          className="flex flex-wrap gap-1.5 mt-1"
        />
      </div>

      {/* Quantity controls */}
      <QuantityControl
        quantity={item.quantity}
        editable={editable}
        onUpdate={(q) => onUpdateQty(item.id, q)}
      />

      {/* Info */}
      <button
        onClick={() => onInfo(item)}
        title="View rules"
        className="text-slate-500 hover:text-slate-300 text-sm px-1 transition shrink-0"
      >
        ⓘ
      </button>

      {/* Remove */}
      {editable && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  );
}
