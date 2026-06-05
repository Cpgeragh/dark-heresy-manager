// src/pages/characterSheet/ArmourTab/ArmourPicker.tsx

import { useState } from "react";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import { PickerModal } from "../../../ui/PickerModal";
import { locationLabel } from "./armourHelpers";

interface Props {
  editable?: boolean;
  onSelect: (ref: ArmourRef) => void;
  onCustom: () => void;
  onClose: () => void;
}

/** Inline reference picker modal — regular armour only (no force fields) */
export function ArmourPicker({ editable = true, onSelect, onCustom, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = ARMOUR_REFERENCE.filter((r) =>
    !r.isForceField && r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Armour"
      placeholder="Search armour…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={editable ? (
        <button
          onClick={onCustom}
          className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
        >
          + Add custom piece
        </button>
      ) : undefined}
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
            <span>AP {ref.ap}{Object.keys(ref.apOverrides ?? {}).length > 0 ? "*" : ""}</span>
            <span>{locationLabel(ref.locations)}</span>
            {ref.notes && <span className="font-sans not-italic">{ref.notes}</span>}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
