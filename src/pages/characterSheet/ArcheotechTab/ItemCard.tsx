// src/pages/characterSheet/ArcheotechTab/ItemCard.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void;
}

export function ItemCard({ item, editable, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasBody = !!(item.description?.trim() || item.notes?.trim());
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;

  const description = item.description ?? ref?.description;
  const specialRules = ref?.specialRules;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const rarity = item.rarity ?? ref?.rarity;
  const source = item.source ?? ref?.source;

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{item.name}</span>
            {item.type && (
              <span className="text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
                {item.type}
              </span>
            )}
            {hasBody && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
            {description && !hasBody && <InfoModal title={item.name} content={description} />}
          </div>

          {/* Expanded body */}
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {specialRules && (
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500 uppercase tracking-wide text-[10px] mr-1">
                    Special
                  </span>
                  {specialRules}
                </p>
              )}
              {description && (
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              )}
              {item.notes?.trim() && (
                <p className="text-xs text-amber-300/70 italic leading-relaxed">{item.notes}</p>
              )}
            </div>
          )}

          {/* Chips */}
          <ItemMetaChips
            weight={weight}
            value={value}
            rarity={rarity}
            source={source}
            valueAmber
            className="flex flex-wrap gap-1.5 mt-1.5"
          />
        </div>

        {editable && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 transition shrink-0 mt-0.5"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
