// src/pages/characterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useMemo, useRef, useState } from "react";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../../data/reference/archeotechReference";
import {
  uiTextBody,
  uiTextMuted,
  uiInfoModalWrapper,
  uiItemName,
  uiTextGMNote,
} from "../../../ui/editableStyles";
import { StatusBadge } from "../../../ui/StatusBadge";
import { PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { formatMoneyInput } from "../../../ui/moneyFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { isVariableMeta } from "../../../utils/customItemMeta";
import { useAssignedItemMeta } from "../../../hooks/useAssignedItemMeta";
import { AssignedItemMetaScreen } from "../../../ui/AssignedItemMetaScreen";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"archeotech">[];
  onSelect: (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"archeotech">) => void;
  onCustom: () => void;
  onClose: () => void;
  suspended?: boolean;
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
  const [pending, setPending] = useState<ArcheotechRef | null>(null);
  const listScrollPositionRef = useRef(0);
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
  } = useAssignedItemMeta({ requiresRarity: true });

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
    isVariableMeta(ref.value) || isVariableMeta(ref.availability);

  function handleRowClick(ref: ArcheotechRef) {
    if (!editable) return;
    if (needsGmInput(ref)) {
      setPending(ref);
      resetAssignedItemMeta();
    } else {
      onSelect(ref);
    }
  }

  function handleAssignedBack() {
    setPending(null);
    resetAssignedItemMeta();
  }

  function handleConfirm() {
    if (!pending || !canConfirm) return;
    onSelect(pending, formatMoneyInput(gmCost), gmRarity);
    handleAssignedBack();
  }

  if (pending) {
    return (
      <AssignedItemMetaScreen
        title="GM-Assigned Values"
        itemName={pending.name}
        explanation="has no standard cost or availability. Enter the values the GM has assigned."
        gmCost={gmCost}
        setGmCost={setGmCost}
        costValid={costValid}
        costPlaceholder="e.g. 5000"
        requiresRarity
        gmRarity={gmRarity}
        setGmRarity={setGmRarity}
        showRarityPicker={showRarityPicker}
        setShowRarityPicker={setShowRarityPicker}
        idPrefix="archeotech-assigned-meta"
        confirmLabel="Add to Inventory"
        canConfirm={canConfirm}
        onBack={handleAssignedBack}
        onConfirm={handleConfirm}
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
          <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap">
            {entry.item.data.type && <span className={uiTextMuted}>{entry.item.data.type}</span>}
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
        <PickerRow key={entry.ref.id} interactive={editable} onClick={() => handleRowClick(entry.ref)}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {entry.ref.name}
            </span>
            {entry.ref.description && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
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
          <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap">
            <span className={uiTextMuted}>{entry.ref.type}</span>
            <ItemMetaChips
              bare
              weight={entry.ref.weight}
              value={isVariableMeta(entry.ref.value) ? undefined : entry.ref.value}
              availability={isVariableMeta(entry.ref.availability) ? undefined : entry.ref.availability}
              source={entry.ref.source}
            />
            {needsGmInput(entry.ref) && (
              <span className={uiTextGMNote}>GM determines cost &amp; availability</span>
            )}
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
