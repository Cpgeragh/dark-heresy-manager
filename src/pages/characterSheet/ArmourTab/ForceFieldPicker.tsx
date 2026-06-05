// src/pages/characterSheet/ArmourTab/ForceFieldPicker.tsx

import { useState } from "react";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  editable?: boolean;
  onSelect: (ref: ArmourRef) => void;
  onClose: () => void;
}

export function ForceFieldPicker({ editable = true, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = ARMOUR_REFERENCE.filter((r) =>
    r.isForceField && r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Force Field"
      placeholder="Search force fields…"
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
          <span className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}>
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap font-mono">
            <span>PR {ref.protectionRating}</span>
            {ref.notes && <span className="font-sans">{ref.notes}</span>}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
