// src/pages/CharacterSheet/weapons/ShieldPicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { SHIELD_REFERENCE, type ShieldRef } from "../../../data/reference/weaponReference";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { ShieldCard } from "./ShieldCard";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import {
  buildShieldFromReference,
  buildShieldSnapshot,
  previewVersionId,
} from "./weaponSnapshotHelpers";

export function ShieldPicker({
  editable = true,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  customLibraryItems?: CampaignCustomItem<"armour">[];
  onSelect: (ref: ShieldRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"armour">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  recordComponentRender("ShieldPicker");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = SHIELD_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustomLibraryItems = customLibraryItems
    .filter((item) => item.data.armourKind === "shield")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Shield" : "View Shields"}
      placeholder="Search shields…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustomLibraryItems.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom shield</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {[
          ...filteredCustomLibraryItems.map((item) => {
            const data = item.data;
            if (data.armourKind !== "shield") return { name: item.name, row: null };
            return {
              name: item.name,
              row: (
                <ShieldCard
                  key={`custom-${item.id}`}
                  item={buildShieldSnapshot(
                    `picker-${item.id}`,
                    {},
                    data,
                    item.id,
                    previewVersionId(item)
                  )}
                  libraryItem={item}
                  editable={false}
                  onSelect={editable ? () => onSelectCustom?.(item) : undefined}
                  onRemove={() => {}}
                />
              ),
            };
          }),
          ...filtered.map((ref) => ({
            name: ref.name,
            row: (
              <ShieldCard
                key={ref.id}
                item={buildShieldFromReference(`picker-${ref.id}`, ref)}
                editable={false}
                onSelect={editable ? () => onSelect(ref) : undefined}
                onRemove={() => {}}
              />
            ),
          })),
        ]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) => entry.row)}
      </PickerList>
    </PickerModal>
  );
}
