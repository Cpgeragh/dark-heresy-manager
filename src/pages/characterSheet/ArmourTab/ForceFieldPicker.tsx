// src/pages/characterSheet/ArmourTab/ForceFieldPicker.tsx

import { useState } from "react";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import { editableInputClass } from "../../../ui/editableStyles";

interface Props {
  onSelect: (ref: ArmourRef) => void;
  onClose: () => void;
}

/** Force field reference picker modal */
export function ForceFieldPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = ARMOUR_REFERENCE.filter((r) =>
    r.isForceField && r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Force Field</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search force fields…"
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  PR {ref.protectionRating}
                </span>
              </div>
              {ref.notes && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.notes}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
