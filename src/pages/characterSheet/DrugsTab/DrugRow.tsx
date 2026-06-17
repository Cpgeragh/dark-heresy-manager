// src/pages/characterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";

export function DrugRow({
  item,
  editable,
  onUpdateQty,
  onRemove,
}: {
  item: DrugItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);
  const hasInfo = !!(ref?.effect || ref?.sideEffect || ref?.notes || item.notes);

  return (
    <div className={[uiSection, "flex items-center gap-3"].join(" ")}>
      {/* Name + duration + chips */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm lg:text-base font-medium text-slate-200">{item.name}</p>
          {hasInfo && (
            <InfoModal
              title={item.name}
              content={
                <>
                  {ref?.duration && (
                    <div>
                      <p className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Duration
                      </p>
                      <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{ref.duration}</p>
                    </div>
                  )}
                  {ref?.effect && (
                    <div>
                      <p className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Effect
                      </p>
                      <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{ref.effect}</p>
                    </div>
                  )}
                  {ref?.sideEffect && (
                    <div>
                      <p className="text-xs lg:text-sm font-semibold text-red-500/70 uppercase tracking-wide mb-1">
                        Side Effects
                      </p>
                      <p className="text-sm lg:text-base text-slate-400 leading-relaxed">{ref.sideEffect}</p>
                    </div>
                  )}
                  {ref?.notes && (
                    <div>
                      <p className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Notes
                      </p>
                      <p className="text-sm lg:text-base text-slate-400 leading-relaxed">{ref.notes}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <p className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Player Notes
                      </p>
                      <p className="text-sm lg:text-base text-slate-400 leading-relaxed">{item.notes}</p>
                    </div>
                  )}
                </>
              }
            />
          )}
        </div>
        {ref?.duration && <p className="text-xs lg:text-sm text-slate-500 mt-0.5">Duration: {ref.duration}</p>}
        <ItemMetaChips
          weight={item.weight ?? ref?.weight ?? "0 kg"}
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

      {/* Remove */}
      {editable && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs lg:text-sm text-red-400 hover:text-red-300 transition shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  );
}
