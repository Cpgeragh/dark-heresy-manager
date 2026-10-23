// src/pages/CharacterSheet/weapons/GrenadePicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { GRENADE_REFERENCE, type GrenadeRef } from "../../../data/reference/weaponReference";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { GrenadeCard } from "./GrenadeCard";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import {
  buildGrenadeFromReference,
  buildGrenadeSnapshot,
  previewVersionId,
} from "./weaponSnapshotHelpers";

export function GrenadePicker({
  editable = true,
  strengthBonus,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  strengthBonus: number;
  customLibraryItems?: CampaignCustomItem<"weapon">[];
  onSelect: (ref: GrenadeRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  recordComponentRender("GrenadePicker");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = GRENADE_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustomLibraryItems = customLibraryItems
    .filter((item) => item.data.weaponKind === "grenade")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Explosive" : "View Explosives"}
      placeholder="Search grenades…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustomLibraryItems.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom grenade or mine</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {[
          ...filteredCustomLibraryItems.map((item) => {
            const data = item.data;
            if (data.weaponKind !== "grenade") return { name: item.name, row: null };
            return {
              name: item.name,
              row: (
                <GrenadeCard
                  key={`custom-${item.id}`}
                  item={buildGrenadeSnapshot(
                    `picker-${item.id}`,
                    {},
                    data,
                    item.id,
                    previewVersionId(item)
                  )}
                  libraryItem={item}
                  editable={false}
                  strengthBonus={strengthBonus}
                  onSelect={editable ? () => onSelectCustom?.(item) : undefined}
                  onRemove={() => {}}
                  onUpdateQty={() => {}}
                />
              ),
            };
          }),
          ...filtered.map((ref) => ({
            name: ref.name,
            row: (
              <GrenadeCard
                key={ref.id}
                item={buildGrenadeFromReference(`picker-${ref.id}`, ref)}
                editable={false}
                strengthBonus={strengthBonus}
                onSelect={editable ? () => onSelect(ref) : undefined}
                onRemove={() => {}}
                onUpdateQty={() => {}}
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
