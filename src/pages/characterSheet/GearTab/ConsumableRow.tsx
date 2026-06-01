// src/pages/characterSheet/GearTab/ConsumableRow.tsx

import { useState } from "react";
import type { ConsumableItem } from "../../../types/Character";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";

interface Props {
  item: ConsumableItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function ConsumableRow({ item, editable, onUpdateQty, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasDesc = !!(item.description?.trim());

  return (
    <div className={sectionContainerClass(editable)}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Qty</span>
          <QuantityControl
            quantity={item.quantity}
            editable={editable}
            size="sm"
            onUpdate={(q) => onUpdateQty(item.id, q)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200">{item.name}</p>
            {hasDesc && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
          </div>
          {hasDesc && expanded && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
          )}
          {hasDesc && !expanded && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
          )}
          <ItemMetaChips
            weight={item.weight ?? "—"}
            value={item.value}
            rarity={item.rarity}
            source={item.source}
            valueAmber
            className="flex flex-wrap gap-1.5 mt-1"
          />
        </div>

        {editable && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
