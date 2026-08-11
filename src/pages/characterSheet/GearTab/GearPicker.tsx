// src/pages/characterSheet/GearTab/GearPicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import {
  uiTextBody,
  uiInfoModalWrapper,
  uiItemName,
  uiTextGMNote,
} from "../../../ui/editableStyles";
import { formatMoneyInput } from "../../../ui/moneyFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/StatusBadge";
import { isVariableMeta } from "../../../utils/customItemMeta";
import { useAssignedItemMeta } from "../../../hooks/useAssignedItemMeta";
import { AssignedItemMetaScreen } from "../../../ui/AssignedItemMetaScreen";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"gear">[];
  onSelect: (ref: GearRef, gmValue?: string, gmRarity?: string) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"gear">) => void;
  onCustom: () => void;
  onClose: () => void;
  suspended?: boolean;
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
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<GearRef | null>(null);
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
  const pendingNeedsRarity = pending ? isVariableMeta(pending.availability) : false;
  const {
    gmCost,
    setGmCost,
    gmRarity,
    setGmRarity,
    showRarityPicker,
    setShowRarityPicker,
    costValid,
    canConfirm,
    resetAssignedItemMeta,
  } = useAssignedItemMeta({ requiresRarity: pendingNeedsRarity });
  const isEmpty = !pending && filtered.length === 0 && filteredCustom.length === 0;

  function handleSelect(ref: GearRef) {
    if (!editable) return;
    if (isVariableMeta(ref.value)) {
      setPending(ref);
      resetAssignedItemMeta();
      return;
    }
    onSelect(ref);
  }

  function handleAssignedBack() {
    setPending(null);
    resetAssignedItemMeta();
  }

  function handleConfirm() {
    if (!pending || !canConfirm) return;
    onSelect(pending, formatMoneyInput(gmCost), pendingNeedsRarity ? gmRarity : undefined);
    handleAssignedBack();
  }

  if (pending) {
    return (
      <AssignedItemMetaScreen
        title="Assigned Cost"
        itemName={pending.name}
        explanation="has a variable or unlisted cost. Enter the value assigned for this item."
        gmCost={gmCost}
        setGmCost={setGmCost}
        costValid={costValid}
        costPlaceholder="e.g. 500"
        requiresRarity={pendingNeedsRarity}
        gmRarity={gmRarity}
        setGmRarity={setGmRarity}
        showRarityPicker={showRarityPicker}
        setShowRarityPicker={setShowRarityPicker}
        idPrefix="gear-assigned-meta"
        confirmLabel="Add to Inventory"
        canConfirm={canConfirm}
        onBack={handleAssignedBack}
        onConfirm={handleConfirm}
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
      isEmpty={isEmpty}
      footer={
        editable ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom item</PickerCustomAction>
        ) : undefined
      }
    >
      {pickerEntries.map((entry) => entry.kind === "custom" ? (
        <PickerRow
          key={`custom-${entry.item.id}`}
          interactive={editable}
          onClick={() => onSelectCustomItem?.(entry.item)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {entry.item.name}
            </span>
            <StatusBadge status={entry.item.status} />
            {entry.item.data.description && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={entry.item.name}
                  content={
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                      {entry.item.data.description}
                    </p>
                  }
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              weight={entry.item.data.weight}
              value={entry.item.data.value}
              availability={entry.item.data.availability}
              source={entry.item.data.source}
            />
          </div>
        </PickerRow>
      ) : (
        <PickerRow key={entry.ref.id} interactive={editable} onClick={() => handleSelect(entry.ref)}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-sm lg:text-base font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}
            >
              {entry.ref.name}
            </span>
            {entry.ref.description && (
              <span
                className="inline-flex items-center -translate-y-[1.4px]"
                onClick={(e) => e.stopPropagation()}
              >
                <InfoModal
                  title={entry.ref.name}
                  content={
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                      {entry.ref.description}
                    </p>
                  }
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              weight={entry.ref.weight}
              value={isVariableMeta(entry.ref.value) ? undefined : entry.ref.value}
              availability={isVariableMeta(entry.ref.availability) ? undefined : entry.ref.availability}
              source={entry.ref.source}
            />
            {isVariableMeta(entry.ref.value) && (
              <span className={uiTextGMNote}>Cost assigned on add</span>
            )}
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
