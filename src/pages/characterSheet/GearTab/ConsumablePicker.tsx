// src/pages/characterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import { CONSUMABLES_REFERENCE, type ConsumableRef } from "../../../data/reference/consumablesReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  onSelect: (ref: ConsumableRef) => void;
  onClose: () => void;
}

export function ConsumablePicker({ onSelect, onClose }: Props) {
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
          onClick={() => onSelect(ref)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </p>
            <span className="text-xs shrink-0">
              <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
              <span className={`ml-2 ${rarityColour(ref.rarity)}`}>{ref.rarity}</span>
            </span>
          </div>
          {ref.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.description}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}
