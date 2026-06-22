// src/pages/characterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";

function drugInfoContent(ref: DrugRef) {
  return (
    <>
      {ref.duration && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>
            Duration
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.duration}</p>
        </div>
      )}
      {ref.effect && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>
            Effect
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.effect}</p>
        </div>
      )}
      {ref.sideEffect && (
        <div>
          <p className="text-xs lg:text-sm font-semibold text-red-500/70 uppercase tracking-wide mb-1">
            Side Effects
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.sideEffect}</p>
        </div>
      )}
      {ref.notes && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
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
      title={editable ? "Add Drug" : "View Drugs"}
      placeholder="Search drugs…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => {
        const hasInfo = !!(ref.duration || ref.effect || ref.sideEffect || ref.notes);

        return (
          <div
            key={ref.id}
            role="button"
            tabIndex={editable ? 0 : -1}
            onClick={editable ? () => onSelect(ref) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
              editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm lg:text-base font-medium text-slate-200 group-hover:text-white truncate">
                  {ref.name}
                </span>
                {hasInfo && (
                  <span
                    className="inline-flex items-center -translate-y-[1.4px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InfoModal title={ref.name} content={drugInfoContent(ref)} />
                  </span>
                )}
              </div>
              <ItemMetaChips
                bare
                weight={ref.weight ?? "0 kg"}
                value={ref.value}
                availability={ref.availability}
                source={ref.source}
                valueAmber
              />
            </div>
            {ref.duration && (
              <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5`}>Duration: {ref.duration}</p>
            )}
          </div>
        );
      })}
    </PickerModal>
  );
}
