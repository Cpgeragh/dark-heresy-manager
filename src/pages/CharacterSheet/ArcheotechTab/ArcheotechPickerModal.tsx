// src/pages/CharacterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useMemo, useRef, useState } from "react";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../../data/reference/archeotechReference";
import { ArcheotechWeaponCard } from "../weapons/ArcheotechWeaponCard";
import { previewVersionId } from "../weapons/weaponSnapshotHelpers";
import { ItemCard } from "./ItemCard";
import {
  ARCHEOTECH_WEAPON_TYPES,
  archeotechFromReference,
  buildArcheotechSnapshot,
} from "./archeotechSnapshotHelpers";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { formatMoneyInput } from "../../../ui/format/moneyFormat";
import { formatWeightInput, isVariableWeight } from "../../../ui/format/weightFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { isVariableMeta } from "../../../data/reference/referenceMeta";
import { useAssignedItemPick, type AssignedItemNeeds } from "../../../hooks/useAssignedItemPick";
import { AssignedItemPickScreen } from "../../../ui/pickers/AssignedItemPickScreen";
import { AssignedOnAddNote } from "../../../ui/pickers/AssignedOnAddNote";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"archeotech">[];
  onSelect: (
    ref: ArcheotechRef,
    gmValue?: string,
    gmRarity?: string,
    gmWeight?: string
  ) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"archeotech">) => void | Promise<boolean | void>;
  onCustom: () => void;
  onClose: () => void;
  suspended?: boolean;
}

function archeotechNeeds(ref: ArcheotechRef): AssignedItemNeeds {
  return { cost: true, weight: isVariableWeight(ref.weight), rarity: true };
}

export function ArcheotechPickerModal({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: Props) {
  const [query, setQuery] = useState("");
  const pick = useAssignedItemPick(archeotechNeeds);
  const listScrollPositionRef = useRef(0);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...ARCHEOTECH_REFERENCE]
      .filter(
        (r) =>
          !normalizedQuery ||
          r.name.toLowerCase().includes(normalizedQuery) ||
          r.type.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);
  const filteredCustom = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return customItems
      .filter((item) => item.status !== "archived")
      .filter(
        (item) =>
          !normalizedQuery ||
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.data.type?.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customItems, query]);
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const needsGmInput = (ref: ArcheotechRef) =>
    isVariableMeta(ref.value) || isVariableMeta(ref.availability) || isVariableWeight(ref.weight);

  function handleRowClick(ref: ArcheotechRef) {
    if (!editable) return;
    if (needsGmInput(ref)) {
      pick.begin(ref);
      return;
    }
    return onSelect(ref);
  }

  if (pick.pending) {
    return (
      <AssignedItemPickScreen
        pick={pick}
        title="GM-Assigned Values"
        explanation={
          pick.needs.weight
            ? "has no standard cost, availability, or weight. Enter the values the GM has assigned."
            : "has no standard cost or availability. Enter the values the GM has assigned."
        }
        costPlaceholder="e.g. 5000"
        idPrefix="archeotech-assigned-meta"
        confirmLabel="Add to Inventory"
        onConfirm={() =>
          pick.confirm((ref) =>
            onSelect(
              ref,
              formatMoneyInput(pick.meta.gmCost),
              pick.meta.gmRarity,
              pick.needs.weight ? formatWeightInput(pick.meta.gmWeight) : undefined
            )
          )
        }
      />
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Archeotech" : "View Archeotech"}
      placeholder="Search archeotech…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable ? (
          <PickerCustomAction onClick={onCustom}>Add Custom Archeotech Item</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) => {
          const item =
            entry.kind === "custom"
              ? buildArcheotechSnapshot(
                  `picker-${entry.item.id}`,
                  undefined,
                  entry.item.data,
                  entry.item.id,
                  previewVersionId(entry.item)
                )
              : archeotechFromReference(`picker-${entry.ref.id}`, entry.ref);
          const libraryItem = entry.kind === "custom" ? entry.item : undefined;
          const key = entry.kind === "custom" ? `custom-${entry.item.id}` : entry.ref.id;
          const previewNote =
            entry.kind === "reference" && needsGmInput(entry.ref) ? (
              <AssignedOnAddNote>GM determines cost &amp; availability</AssignedOnAddNote>
            ) : undefined;
          const onSelectRow = !editable
            ? undefined
            : entry.kind === "custom"
              ? () => onSelectCustomItem?.(entry.item)
              : () => handleRowClick(entry.ref);

          return ARCHEOTECH_WEAPON_TYPES.includes(item.type ?? "") ? (
            <ArcheotechWeaponCard
              key={key}
              item={item}
              libraryItem={libraryItem}
              highlightAsArcheotech={false}
              preview
              previewNote={previewNote}
              onSelect={onSelectRow}
            />
          ) : (
            <ItemCard
              key={key}
              item={item}
              editable={false}
              libraryItem={libraryItem}
              preview
              previewNote={previewNote}
              onSelect={onSelectRow}
              onRemove={() => {}}
            />
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
