import { useState } from "react";
import type { RangedWeaponRef, MeleeWeaponRef } from "../../../data/reference/weaponReference";
import { PickerModal } from "../../../ui/PickerModal";
import { INTEGRATED_RANGED_REFS, INTEGRATED_MELEE_REFS } from "../../../utils/weaponUtils";

export function IntegratedWeaponPicker({
  editable = true,
  onSelectRanged,
  onSelectMelee,
  onClose,
}: {
  editable?: boolean;
  onSelectRanged: (ref: RangedWeaponRef) => void;
  onSelectMelee: (ref: MeleeWeaponRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const lowerQuery = query.toLowerCase();
  const ranged = INTEGRATED_RANGED_REFS.filter((ref) =>
    ref.name.toLowerCase().includes(lowerQuery)
  );
  const melee = INTEGRATED_MELEE_REFS.filter((ref) => ref.name.toLowerCase().includes(lowerQuery));
  const isEmpty = ranged.length === 0 && melee.length === 0;

  return (
    <PickerModal
      title="Add Integrated Weapon"
      placeholder="Search integrated weapons..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={isEmpty}
    >
      {ranged.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelectRanged(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap font-mono">
            <span>{ref.class}</span>
            <span>{ref.range}</span>
            <span>{ref.rof}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
          </div>
        </button>
      ))}
      {melee.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelectMelee(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap font-mono">
            <span>{ref.class}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
