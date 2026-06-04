// src/pages/characterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { editableInputClass, sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: GearItem;
  editable: boolean;
  onUpdateValue: (value: string) => void;
  onRemove: () => void;
}

export function ItemRow({ item, editable, onUpdateValue, onRemove }: Props) {
  const hasDesc = !!(item.description?.trim());

  // Fall back to reference data for items saved before weight/value/rarity were stored
  const ref = item.referenceId
    ? GEAR_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;
  const weight = item.weight ?? ref?.weight;
  const value  = item.value  ?? ref?.value;
  const rarity = item.rarity ?? ref?.rarity;
  const minValue = ref?.id === "goreman-carta-sanguine" ? 100 : undefined;

  function handleValueChange(next: string) {
    onUpdateValue(next);
  }

  function handleValueBlur() {
    if (minValue === undefined) return;
    const numeric = Number((value ?? "").match(/\d+/)?.[0] ?? "");
    if (!Number.isFinite(numeric) || numeric < minValue) {
      onUpdateValue(`${minValue} Thrones`);
      return;
    }
    onUpdateValue(`${Math.floor(numeric)} Thrones`);
  }

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
          {editable && (
            <div className="mt-2 max-w-[11rem] space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wide">
                Value
              </label>
              <input
                type="text"
                inputMode={minValue === undefined ? undefined : "numeric"}
                value={value ?? ""}
                onChange={(e) => handleValueChange(e.target.value)}
                onBlur={handleValueBlur}
                placeholder={ref?.value ?? "Value"}
                className={editableInputClass(true)}
              />
            </div>
          )}
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
