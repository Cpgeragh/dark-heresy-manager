// src/pages/characterSheet/GearTab/GearPicker.tsx

import { useState } from "react";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  onSelect: (ref: GearRef) => void;
  onCustom: () => void;
  onClose: () => void;
}

export function GearPicker({ onSelect, onCustom, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = GEAR_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Item"
      placeholder="Search gear…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={
        <button
          onClick={onCustom}
          className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
        >
          + Add custom item
        </button>
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={() => onSelect(ref)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
        >
          <p className="text-sm font-medium text-slate-200 group-hover:text-white">{ref.name}</p>
          {ref.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.description}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}
