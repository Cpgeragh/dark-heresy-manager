// src/pages/characterSheet/ArmourTab/ForceFieldPicker.tsx

import { useState } from "react";
import type { ArmourCraftsmanship } from "../../../types/Character";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { PickerModal } from "../../../ui/PickerModal";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { uiTextMuted, uiTextBody, uiItemName } from "../../../ui/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/colourTokens";
import { StatChip } from "../weapons/weaponShared";
import { ARMOUR_CRAFTSMANSHIP_STYLE } from "./ArmourPicker";

const ARMOUR_CRAFTSMANSHIP_OPTIONS: ArmourCraftsmanship[] = ["Poor", "Common", "Good", "Best"];

function craftsmanshipDescription(craftsmanship: ArmourCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poorly constructed field generator. Overloads on a roll of 01–15.";
    case "Good":
      return "Well constructed field generator. Overloads on a roll of 01–05.";
    case "Best":
      return "Finest available field generator. Overloads only on a roll of 1.";
    case "Common":
    default:
      return "Standard field generator. Overloads on a roll of 01–10.";
  }
}

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"armour">[];
  onSelect: (ref: ArmourRef, craftsmanship: ArmourCraftsmanship) => void;
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
  const [selected, setSelected] = useState<ArmourRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<ArmourCraftsmanship>("Common");
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

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        titleClassName="text-slate-200"
        closeLabel="←"
        query=""
        onQueryChange={() => {}}
        onClose={resetPicker}
        isEmpty={false}
        hideSearch
        footer={
          <Button className="w-full" onClick={() => onSelect(selected, craftsmanship)}>
            Add Force Field
          </Button>
        }
      >
        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select field craftsmanship:</p>
            <div className="flex gap-2">
              {ARMOUR_CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
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
          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {craftsmanshipDescription(craftsmanship)}
          </div>
        </div>
      </PickerModal>
    );
  }

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
          <div
            key={item.id}
            role="button"
            tabIndex={editable ? 0 : -1}
            onClick={editable ? () => onSelectCustomItem?.(item) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <span className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}>
              {item.name}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.protectionRating !== undefined && <StatChip size="sm" label="PR" value={String(data.protectionRating)} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {item.status === "draft" && (
                <Chip size="sm" className={colourAmberFaint}>Draft</Chip>
              )}
              <Chip size="sm" className={colourFuchsia}>Custom</Chip>
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
            </div>
          </div>
        );
      })}
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => setSelected(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}>
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ref.protectionRating !== undefined && <StatChip size="sm" label="PR" value={String(ref.protectionRating)} />}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
          </div>
        </div>
      ))}
    </PickerModal>
  );
}
