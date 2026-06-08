// src/pages/characterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { PickerModal } from "../../../ui/PickerModal";

function drugInfoContent(ref: DrugRef) {
  return (
    <>
      {ref.duration && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Duration
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{ref.duration}</p>
        </div>
      )}
      {ref.effect && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Effect
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{ref.effect}</p>
        </div>
      )}
      {ref.sideEffect && (
        <div>
          <p className="text-xs font-semibold text-red-500/70 uppercase tracking-wide mb-1">
            Side Effects
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">{ref.sideEffect}</p>
        </div>
      )}
      {ref.notes && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-slate-400 leading-relaxed">{ref.notes}</p>
        </div>
      )}
    </>
  );
}

export function DrugPicker({
  editable = true,
  onSelect,
  onClose,
}: {
  editable?: boolean;
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
      placeholder="Search drugs..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => {
        const hasInfo = !!(ref.duration || ref.effect || ref.sideEffect || ref.notes);

        return (
          <button
            key={ref.id}
            onClick={editable ? () => onSelect(ref) : undefined}
            className={`w-full text-left px-4 py-3 transition group ${
              editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                  {ref.name}
                </span>
                {hasInfo && (
                  <span
                    className="inline-flex items-center leading-[0]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InfoModal title={ref.name} content={drugInfoContent(ref)} />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className="text-slate-400">{ref.weight ?? "0 kg"}</span>
                <span className="text-amber-400/80 font-mono">{ref.value}</span>
                <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
              </div>
            </div>
            {ref.duration && (
              <p className="text-xs text-slate-500 mt-0.5">Duration: {ref.duration}</p>
            )}
          </button>
        );
      })}
    </PickerModal>
  );
}
