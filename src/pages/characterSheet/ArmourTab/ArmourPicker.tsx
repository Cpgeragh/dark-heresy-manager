// src/pages/characterSheet/ArmourTab/ArmourPicker.tsx

import { useState } from "react";
import type { ArmourCraftsmanship } from "../../../types/Character";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import { PickerModal } from "../../../ui/PickerModal";
import { Button } from "../../../ui/Button";
import { locationLabel } from "./armourHelpers";

const ARMOUR_CRAFTSMANSHIP_OPTIONS: ArmourCraftsmanship[] = ["Poor", "Common", "Good", "Best"];

const ARMOUR_CRAFTSMANSHIP_STYLE: Record<ArmourCraftsmanship, string> = {
  Poor: "border-red-500/70 bg-red-500/15 text-red-300",
  Common: "border-slate-500 bg-slate-800 text-slate-200",
  Good: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
  Best: "border-amber-400 bg-amber-500/20 text-amber-300",
};

function craftsmanshipDescription(craftsmanship: ArmourCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Badly fitted, designed or damaged armour. Characters wearing Poor armour take a -10 penalty to all Agility Tests.";
    case "Good":
      return "Well constructed and better fitting armour. Against the first attack in any round, the armour increases its AP by 1.";
    case "Best":
      return "Finely wrought and perfectly fitted armour. Best armour weighs half the normal amount and increases its AP by 1.";
    case "Common":
    default:
      return "Standard armour craftsmanship. No additional modifier.";
  }
}

interface Props {
  editable?: boolean;
  onSelect: (ref: ArmourRef, craftsmanship: ArmourCraftsmanship) => void;
  onCustom: () => void;
  onClose: () => void;
}

/** Inline reference picker modal — regular armour only (no force fields) */
export function ArmourPicker({ editable = true, onSelect, onCustom, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ArmourRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<ArmourCraftsmanship>("Common");
  const filtered = ARMOUR_REFERENCE.filter(
    (r) => !r.isForceField && r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (selected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-500 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">{selected.name}</h3>
            <button
              onClick={resetPicker}
              className="text-slate-400 hover:text-slate-200 text-lg leading-none"
            >
              {"\u00D7"}
            </button>
          </div>

          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">Select armour quality:</p>
              <div className="flex gap-2">
                {ARMOUR_CRAFTSMANSHIP_OPTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setCraftsmanship(q)}
                    className={[
                      "flex-1 py-1.5 rounded border text-sm font-medium transition",
                      craftsmanship === q
                        ? ARMOUR_CRAFTSMANSHIP_STYLE[q]
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/60 rounded p-3 leading-relaxed">
              {craftsmanshipDescription(craftsmanship)}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
            <button
              onClick={resetPicker}
              className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
            >
              Back
            </button>
            <Button className="flex-1" onClick={() => onSelect(selected, craftsmanship)}>
              Add Armour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PickerModal
      title="Add Armour"
      placeholder="Search armour…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={
        editable ? (
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom piece
          </button>
        ) : undefined
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => setSelected(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap font-mono">
            <span>
              AP {ref.ap}
              {Object.keys(ref.apOverrides ?? {}).length > 0 ? "*" : ""}
            </span>
            <span>{locationLabel(ref.locations)}</span>
            {ref.notes && <span className="font-sans not-italic">{ref.notes}</span>}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
