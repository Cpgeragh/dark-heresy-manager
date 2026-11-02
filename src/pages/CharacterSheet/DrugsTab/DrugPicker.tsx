// src/pages/CharacterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { previewVersionId } from "../weapons/weaponSnapshotHelpers";
import { buildDrugSnapshot, drugFromReference } from "./drugSnapshotHelpers";
import { DrugRow } from "./DrugRow";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { recordComponentRender } from "../../../performance/performanceMetrics";

export function DrugPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  customItems?: CampaignCustomItem<"drug">[];
  onSelect: (ref: DrugRef) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"drug">) => void | Promise<boolean | void>;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  recordComponentRender("DrugPicker");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = DRUGS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Drug" : "View Drugs"}
      placeholder="Search drugs…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>Add Custom Drug</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) =>
          entry.kind === "custom" ? (
            <DrugRow
              key={`custom-${entry.item.id}`}
              item={buildDrugSnapshot(
                `picker-${entry.item.id}`,
                1,
                entry.item.data,
                entry.item.id,
                previewVersionId(entry.item)
              )}
              editable={false}
              libraryItem={entry.item}
              preview
              onSelect={editable ? () => onSelectCustomItem?.(entry.item) : undefined}
              onUpdateQty={() => {}}
              onRemove={() => {}}
            />
          ) : (
            <DrugRow
              key={entry.ref.id}
              item={drugFromReference(`picker-${entry.ref.id}`, entry.ref)}
              editable={false}
              preview
              onSelect={editable ? () => onSelect(entry.ref) : undefined}
              onUpdateQty={() => {}}
              onRemove={() => {}}
            />
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
