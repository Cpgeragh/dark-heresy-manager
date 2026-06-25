// src/pages/characterSheet/ArmourTab/ForceFieldPicker.tsx

import { useState } from "react";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"armour">[];
  onSelect: (ref: ArmourRef) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"armour">) => void;
  onClose: () => void;
}

export function ForceFieldPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const normalisedQuery = query.toLowerCase();
  const filteredCustom = customItems
    .filter((item) => {
      if (item.data.armourKind !== "worn" || !item.data.isForceField) return false;
      return item.name.toLowerCase().includes(normalisedQuery);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const filtered = ARMOUR_REFERENCE.filter(
    (r) => r.isForceField && r.name.toLowerCase().includes(normalisedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Force Field" : "View Force Fields"}
      placeholder="Search force fields..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
    >
      {filteredCustom.map((item) => {
        const data = item.data;
        if (data.armourKind !== "worn") return null;
        return (
          <button
            key={item.id}
            onClick={editable ? () => onSelectCustomItem?.(item) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <span
              className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
            >
              {item.name}
            </span>
            <div className="flex items-center gap-2 text-xs lg:text-sm text-slate-500 mt-0.5 flex-wrap font-code">
              <span>PR {data.protectionRating}</span>
              {item.status === "draft" && (
                <span className="font-sans rounded border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-amber-300">
                  Draft
                </span>
              )}
              <span className="font-sans rounded border border-fuchsia-500/50 bg-fuchsia-500/10 px-1.5 py-0.5 text-fuchsia-300">
                Custom
              </span>
            </div>
          </button>
        );
      })}
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs lg:text-sm text-slate-500 mt-0.5 flex-wrap font-code">
            <span>PR {ref.protectionRating}</span>
            {ref.notes && <span className="font-sans">{ref.notes}</span>}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
