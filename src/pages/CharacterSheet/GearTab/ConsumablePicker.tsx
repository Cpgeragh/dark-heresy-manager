// src/pages/CharacterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import {
  CONSUMABLES_REFERENCE,
  type ConsumableRef,
} from "../../../data/reference/consumablesReference";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { formatMoneyInput, openEndedCostMinimum } from "../../../ui/format/moneyFormat";
import { useAssignedItemPick, type AssignedItemNeeds } from "../../../hooks/useAssignedItemPick";
import { AssignedItemPickScreen } from "../../../ui/pickers/AssignedItemPickScreen";
import { AssignedOnAddNote } from "../../../ui/pickers/AssignedOnAddNote";
import { previewVersionId } from "../weapons/weaponSnapshotHelpers";
import { buildConsumableSnapshot, consumableFromReference } from "./gearSnapshotHelpers";
import { ConsumableRow } from "./ConsumableRow";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"consumable">[];
  onSelect: (ref: ConsumableRef, gmValue?: string) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"consumable">) => void | Promise<boolean | void>;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}

function consumableNeeds(ref: ConsumableRef): AssignedItemNeeds {
  return { cost: true, weight: false, rarity: false, minimumCost: openEndedCostMinimum(ref.value) };
}

export function ConsumablePicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: Props) {
  recordComponentRender("ConsumablePicker");
  const [query, setQuery] = useState("");
  const pick = useAssignedItemPick(consumableNeeds);
  const normalizedQuery = query.toLowerCase();
  const filtered = CONSUMABLES_REFERENCE.filter((r) =>
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

  function handleSelect(ref: ConsumableRef) {
    if (openEndedCostMinimum(ref.value) !== undefined) {
      pick.begin(ref);
      return;
    }
    return onSelect(ref);
  }

  if (pick.pending) {
    return (
      <AssignedItemPickScreen
        pick={pick}
        title="Assigned Cost"
        idPrefix="consumable-assigned-meta"
        confirmLabel="Add to Inventory"
        onConfirm={() => pick.confirm((ref) => onSelect(ref, formatMoneyInput(pick.meta.gmCost)))}
      />
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Consumable" : "View Consumables"}
      placeholder="Search consumables…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>Add Custom Consumable</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) =>
          entry.kind === "custom" ? (
            <ConsumableRow
              key={`custom-${entry.item.id}`}
              item={buildConsumableSnapshot(
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
            <ConsumableRow
              key={entry.ref.id}
              item={consumableFromReference(`picker-${entry.ref.id}`, entry.ref)}
              editable={false}
              preview
              previewNote={
                openEndedCostMinimum(entry.ref.value) !== undefined ? (
                  <AssignedOnAddNote>Cost assigned on add</AssignedOnAddNote>
                ) : undefined
              }
              onSelect={editable ? () => handleSelect(entry.ref) : undefined}
              onUpdateQty={() => {}}
              onRemove={() => {}}
            />
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
