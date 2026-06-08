// src/pages/characterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { CONSUMABLES_REFERENCE, type ConsumableRef } from "../../../data/reference/consumablesReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  editable?: boolean;
  onSelect: (ref: ConsumableRef) => void;
  onClose: () => void;
}

function displayWeight(weight?: string | null) {
  const value = weight?.trim();
  if (!value || value === "\u2014" || value.includes("\u20ac")) return "0 kg";
  return value;
}

export function ConsumablePicker({ editable = true, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = CONSUMABLES_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Consumable"
      placeholder="Search consumables…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`text-sm font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}>
                {ref.name}
              </span>
              {ref.description && (
                <span className="inline-flex items-center leading-[0]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={ref.name}
                    content={<p className="text-sm text-slate-300 leading-relaxed">{ref.description}</p>}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-slate-400">{displayWeight(ref.weight)}</span>
              <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            </div>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
