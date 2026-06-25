// src/pages/characterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { CONSUMABLES_REFERENCE, type ConsumableRef } from "../../../data/reference/consumablesReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { uiTextBody } from "../../../ui/editableStyles";
import type { CampaignCustomItem } from "../../../types/CustomItems";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"consumable">[];
  onSelect: (ref: ConsumableRef) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"consumable">) => void;
  onCustom?: () => void;
  onClose: () => void;
}

export function ConsumablePicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = CONSUMABLES_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Consumable" : "View Consumables"}
      placeholder="Search consumables…"
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
            + Add custom consumable
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
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm lg:text-base font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}>
              {item.name}
            </span>
            {item.status === "draft" && (
              <span className="shrink-0 rounded border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                Draft
              </span>
            )}
            {item.data.description && (
              <span className="inline-flex items-center -translate-y-[1.4px]" onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={item.name}
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.data.description}</p>}
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              weight={item.data.weight}
              value={item.data.value}
              availability={item.data.availability}
              source={item.data.source}
            />
          </div>
        </div>
      ))}

      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm lg:text-base font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}>
              {ref.name}
            </span>
            {ref.description && (
              <span className="inline-flex items-center -translate-y-[1.4px]" onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={ref.name}
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>}
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              weight={ref.weight}
              value={ref.value}
              availability={ref.availability}
              source={ref.source}
            />
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
