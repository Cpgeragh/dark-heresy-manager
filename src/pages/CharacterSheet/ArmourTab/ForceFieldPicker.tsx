// src/pages/CharacterSheet/ArmourTab/ForceFieldPicker.tsx

import { useRef, useState } from "react";
import type { ArmourCraftsmanship } from "../../../types/Character";
import { ARMOUR_REFERENCE, type ArmourRef } from "../../../data/reference/armourReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { uiTextBody } from "../../../ui/styles/editableStyles";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { StatChip } from "../../../ui/chips/StatChip";
import { forceFieldCraftsmanshipDescription } from "./armourHelpers";
import { recordComponentRender } from "../../../performance/performanceMetrics";

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
  recordComponentRender("ForceFieldPicker");
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
          <Button
            className="w-full"
            onClick={() => {
              onSelect(selected, craftsmanship);
              resetPicker();
            }}
          >
            Add Force Field
          </Button>
        }
      >
        <PickerBody>
          <div>
            <p className={`text-xs lg:text-sm ${uiTextBody} mb-2`}>Select field craftsmanship:</p>
            <div className="flex gap-2">
              {CRAFTSMANSHIP_OPTIONS.map((q) => (
                <ToggleButton
                  key={q}
                  selected={craftsmanship === q}
                  selectedClassName={CRAFTSMANSHIP_STYLE[q]}
                  className="flex-1 py-1.5 lg:py-2 text-sm lg:text-base font-medium"
                  onClick={() => setCraftsmanship(q)}
                >
                  {q}
                </ToggleButton>
              ))}
            </div>
          </div>
          <div
            className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}
          >
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
          <PickerCustomAction onClick={onCustom}>+ Add custom field</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) => {
          if (entry.kind === "reference") {
            const ref = entry.ref;
            return (
              <PickerRow key={ref.id} interactive={editable} onClick={() => setSelected(ref)}>
                <PickerRowName name={ref.name} />
                <PickerRowChips>
                  {ref.protectionRating !== undefined && (
                    <StatChip size="sm" label="PR" value={String(ref.protectionRating)} />
                  )}
                </PickerRowChips>
                <PickerRowChips>
                  <ItemMetaChips
                    weight={ref.weight}
                    value={ref.value}
                    availability={ref.availability}
                    source={ref.source}
                  />
                </PickerRowChips>
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
              <PickerRowName name={item.name} />
              <PickerRowChips>
                {data.protectionRating !== undefined && (
                  <StatChip size="sm" label="PR" value={String(data.protectionRating)} />
                )}
              </PickerRowChips>
              <PickerRowChips>
                {item.status === "draft" && (
                  <Chip size="sm" colour="amber">
                    Draft
                  </Chip>
                )}
                <Chip size="sm" colour="fuchsia">
                  Custom
                </Chip>
                <ItemMetaChips
                  weight={data.weight}
                  value={data.value}
                  availability={data.availability}
                  source={data.source}
                />
              </PickerRowChips>
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
