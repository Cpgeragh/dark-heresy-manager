// src/pages/characterSheet/ArmourTab/ForceFieldPicker.tsx

import { useRef, useState } from "react";
import type { ArmourCraftsmanship } from "../../../types/Character";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { ArrowLeft } from "../../../ui/PickerArrows";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { uiTextMuted, uiTextBody, uiItemName } from "../../../ui/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { StatChip } from "../../../ui/StatChip";
import {
  forceFieldCraftsmanshipDescription,
} from "./armourHelpers";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"armour">[];
  onSelect: (ref: ArmourRef, craftsmanship: ArmourCraftsmanship) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"armour">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}

export function ForceFieldPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ArmourRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<ArmourCraftsmanship>("Common");
  const listScrollPositionRef = useRef(0);
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
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        titleClassName="text-slate-200"
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        query=""
        onQueryChange={() => {}}
        onClose={resetPicker}
        isEmpty={false}
        hideSearch
        footer={
          <Button className="w-full" onClick={() => {
            onSelect(selected, craftsmanship);
            resetPicker();
          }}>
            Add Force Field
          </Button>
        }
      >
        <PickerBody>
          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select field craftsmanship:</p>
            <div className="flex gap-2">
              {CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button type="button"
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === q
                      ? CRAFTSMANSHIP_STYLE[q]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {forceFieldCraftsmanshipDescription(craftsmanship)}
          </div>
        </PickerBody>
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
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable ? (
          <PickerCustomAction
            onClick={onCustom}
          >
            + Add custom field
          </PickerCustomAction>
        ) : undefined
      }
    >
      {pickerEntries.map((entry) => {
        if (entry.kind === "reference") {
          const ref = entry.ref;
          return (
            <PickerRow key={ref.id} interactive={editable} onClick={() => setSelected(ref)}>
              <span className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}>{ref.name}</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ref.protectionRating !== undefined && <StatChip size="sm" label="PR" value={String(ref.protectionRating)} />}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
              </div>
            </PickerRow>
          );
        }

        const item = entry.item;
        const data = item.data;
        if (data.armourKind !== "worn") return null;
        return (
          <PickerRow
            key={item.id}
            interactive={editable}
            onClick={() => onSelectCustomItem?.(item)}
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
          </PickerRow>
        );
      })}
    </PickerModal>
  );
}
