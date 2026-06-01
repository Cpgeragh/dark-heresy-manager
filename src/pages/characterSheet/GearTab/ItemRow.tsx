// src/pages/characterSheet/GearTab/ItemRow.tsx

import { useState } from "react";
import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";

interface Props {
  item: GearItem;
  editable: boolean;
  onRemove: () => void;
}

export function ItemRow({ item, editable, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
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
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
          </div>
          {!hasDesc && <p className="text-xs text-slate-600 italic">No description.</p>}
          {hasDesc && expanded && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
          )}
          {hasDesc && !expanded && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
          )}
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
