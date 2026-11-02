// src/pages/CharacterSheet/GearTab/GearPicker.tsx

import { useRef, useState } from "react";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { previewVersionId } from "../weapons/weaponSnapshotHelpers";
import { buildGearSnapshot, gearFromReference } from "./gearSnapshotHelpers";
import { ItemRow } from "./ItemRow";
import { formatMoneyInput, openEndedCostMinimum } from "../../../ui/format/moneyFormat";
import { formatWeightInput, isVariableWeight } from "../../../ui/format/weightFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { isVariableMeta } from "../../../data/reference/referenceMeta";
import { useAssignedItemPick, type AssignedItemNeeds } from "../../../hooks/useAssignedItemPick";
import { AssignedItemPickScreen } from "../../../ui/pickers/AssignedItemPickScreen";
import { AssignedOnAddNote } from "../../../ui/pickers/AssignedOnAddNote";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"gear">[];
  onSelect: (
    ref: GearRef,
    gmValue?: string,
    gmRarity?: string,
    gmWeight?: string
  ) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"gear">) => void | Promise<boolean | void>;
  onCustom: () => void;
  onClose: () => void;
  suspended?: boolean;
}

function gearNeeds(ref: GearRef): AssignedItemNeeds {
  const minimumCost = openEndedCostMinimum(ref.value);
  return {
    cost: isVariableMeta(ref.value) || minimumCost !== undefined,
    weight: isVariableWeight(ref.weight),
    rarity: isVariableMeta(ref.availability),
    minimumCost,
  };
}

export function GearPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: Props) {
  recordComponentRender("GearPicker");
  const [query, setQuery] = useState("");
  const pick = useAssignedItemPick(gearNeeds);
  const { pending, needs, meta } = pick;
  const listScrollPositionRef = useRef(0);
  const normalizedQuery = query.toLowerCase();
  const filtered = GEAR_REFERENCE.filter((r) =>
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
  const isEmpty = !pending && filtered.length === 0 && filteredCustom.length === 0;

  function handleSelect(ref: GearRef) {
    if (!editable) return;
    const refNeeds = gearNeeds(ref);
    if (refNeeds.cost || refNeeds.weight) {
      pick.begin(ref);
      return;
    }
    return onSelect(ref);
  }

  if (pending) {
    const assignedTitle =
      needs.cost && needs.weight
        ? "Assigned Cost and Weight"
        : needs.weight
          ? "Assigned Weight"
          : "Assigned Cost";
    const assignedExplanation =
      needs.cost && needs.weight
        ? "has a variable cost and weight. Enter the values assigned for this item."
        : needs.weight
          ? "has a variable weight. Enter the weight assigned for this item."
          : "has a variable or unlisted cost. Enter the value assigned for this item.";
    return (
      <AssignedItemPickScreen
        pick={pick}
        title={assignedTitle}
        explanation={assignedExplanation}
        idPrefix="gear-assigned-meta"
        confirmLabel="Add to Inventory"
        onConfirm={() =>
          pick.confirm((ref) =>
            onSelect(
              ref,
              needs.cost ? formatMoneyInput(meta.gmCost) : undefined,
              needs.rarity ? meta.gmRarity : undefined,
              needs.weight ? formatWeightInput(meta.gmWeight) : undefined
            )
          )
        }
      />
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Item" : "View Items"}
      placeholder="Search gear…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={isEmpty}
      footer={
        editable ? (
          <PickerCustomAction onClick={onCustom}>Add Custom Item</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) =>
          entry.kind === "custom" ? (
            <ItemRow
              key={`custom-${entry.item.id}`}
              item={buildGearSnapshot(
                `picker-${entry.item.id}`,
                entry.item.data,
                entry.item.id,
                previewVersionId(entry.item)
              )}
              editable={false}
              libraryItem={entry.item}
              preview
              onSelect={editable ? () => onSelectCustomItem?.(entry.item) : undefined}
              onRemove={() => {}}
            />
          ) : (
            <ItemRow
              key={entry.ref.id}
              item={gearFromReference(`picker-${entry.ref.id}`, entry.ref)}
              editable={false}
              preview
              previewNote={
                isVariableMeta(entry.ref.value) ||
                openEndedCostMinimum(entry.ref.value) !== undefined ? (
                  <AssignedOnAddNote>Cost assigned on add</AssignedOnAddNote>
                ) : undefined
              }
              onSelect={editable ? () => handleSelect(entry.ref) : undefined}
              onRemove={() => {}}
            />
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
