// src/pages/characterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { uiTextBody, uiTextLabel, uiTextMuted, uiItemName, uiInfoModalWrapper } from "../../../ui/editableStyles";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/StatusBadge";

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
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
}: {
  editable?: boolean;
  customItems?: CampaignCustomItem<"drug">[];
  onSelect: (ref: DrugRef) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"drug">) => void;
  onCustom?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = DRUGS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Drug" : "View Drugs"}
      placeholder="Search drugs…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && onCustom ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom drug
          </button>
        ) : undefined
      }
    >
      {filteredCustom.map((item) => (
        <div
          key={`custom-${item.id}`}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable && onSelectCustomItem ? () => onSelectCustomItem(item) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
            editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} group-hover:text-white truncate`}>
              {item.name}
            </span>
            <StatusBadge status={item.status} />
            {item.data.notes && (
              <span
                className={uiInfoModalWrapper}
                onClick={(e) => e.stopPropagation()}
              >
                <InfoModal
                  title={item.name}
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.data.notes}</p>}
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ItemMetaChips
              bare
              weight={item.data.weight ?? "0 kg"}
              value={item.data.value}
              availability={item.data.availability}
              source={item.data.source}
            />
          </div>
        </div>
      ))}

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
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`${uiItemName} group-hover:text-white truncate`}>
                {ref.name}
              </span>
              {hasInfo && (
                <span
                  className={uiInfoModalWrapper}
                  onClick={(e) => e.stopPropagation()}
                >
                  <InfoModal title={ref.name} content={drugInfoContent(ref)} />
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ItemMetaChips
                bare
                weight={ref.weight ?? "0 kg"}
                value={ref.value}
                availability={ref.availability}
                source={ref.source}
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
