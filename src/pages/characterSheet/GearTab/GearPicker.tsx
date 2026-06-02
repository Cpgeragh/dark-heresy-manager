// src/pages/characterSheet/GearTab/GearPicker.tsx

import { useState } from "react";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { editableInputClass } from "../../../ui/editableStyles";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Item</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search gear…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
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
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom item
          </button>
        </div>
      </div>
    </div>
  );
}
