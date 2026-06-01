// src/pages/characterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { PickerModal } from "../../../ui/PickerModal";

export function DrugPicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: DrugRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = DRUGS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Drug"
      placeholder="Search drugs…"
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
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </span>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            </div>
          </div>
          {ref.duration && (
            <p className="text-xs text-slate-500 mt-0.5">⏱ {ref.duration}</p>
          )}
          {ref.effect && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ref.effect}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}
