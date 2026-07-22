// src/pages/characterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useState, useMemo } from "react";
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
}

export function ArcheotechPickerModal({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<ArcheotechRef | null>(null);
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
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom item</PickerCustomAction>
        ) : undefined
      }
    >
      {filteredCustom.map((item) => (
        <PickerRow
          key={`custom-${item.id}`}
          interactive={editable}
          onClick={() => onSelectCustomItem?.(item)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {item.name}
            </span>
            <StatusBadge status={item.status} />
            {item.data.description && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={item.name}
                  content={
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                      {item.data.description}
                    </p>
                  }
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap">
            {item.data.type && <span className={uiTextMuted}>{item.data.type}</span>}
            <ItemMetaChips
              bare
              weight={item.data.weight}
              value={item.data.value}
              availability={item.data.availability}
              source={item.data.source}
            />
          </div>
        </PickerRow>
      ))}

      {filtered.map((ref) => (
        <PickerRow key={ref.id} interactive={editable} onClick={() => handleRowClick(ref)}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {ref.name}
            </span>
            {ref.description && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={ref.name}
                  content={
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                      {ref.description}
                    </p>
                  }
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap">
            <span className={uiTextMuted}>{ref.type}</span>
            <ItemMetaChips
              bare
              weight={ref.weight}
              value={isVariableMeta(ref.value) ? undefined : ref.value}
              availability={isVariableMeta(ref.availability) ? undefined : ref.availability}
              source={ref.source}
            />
            {needsGmInput(ref) && (
              <span className={uiTextGMNote}>GM determines cost &amp; availability</span>
            )}
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
