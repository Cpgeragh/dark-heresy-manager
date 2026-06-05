// src/pages/characterSheet/GearTab/GearPicker.tsx

import { useState } from "react";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  editable?: boolean;
  onSelect: (ref: GearRef) => void;
  onCustom: () => void;
  onClose: () => void;
}

export function GearPicker({ editable = true, onSelect, onCustom, onClose }: Props) {
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
      footer={editable ? (
        <button
          onClick={onCustom}
          className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
        >
          + Add custom item
        </button>
      ) : undefined}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <p className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}>{ref.name}</p>
          {ref.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.description}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}
