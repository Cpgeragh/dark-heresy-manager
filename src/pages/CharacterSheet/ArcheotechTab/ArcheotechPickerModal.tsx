// src/pages/CharacterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useMemo, useRef, useState } from "react";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../../data/reference/archeotechReference";
import { uiTextGMNote } from "../../../ui/styles/editableStyles";
import {
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import {
  PickerRowChips,
  PickerRowLine,
  PickerRowName,
  PickerRowRulesLine,
} from "../../../ui/pickers/PickerRowParts";
import { InfoParagraph } from "../../../ui/InfoSection";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { formatMoneyInput } from "../../../ui/format/moneyFormat";
import { formatWeightInput, isVariableWeight } from "../../../ui/format/weightFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { isVariableMeta } from "../../../data/reference/referenceMeta";
import { useAssignedItemMeta } from "../../../hooks/useAssignedItemMeta";
import { AssignedItemMetaScreen } from "../../../ui/pickers/AssignedItemMetaScreen";

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
  const pendingNeedsWeight = pending ? isVariableWeight(pending.weight) : false;
  const {
    gmCost,
    setGmCost,
    gmWeight,
    setGmWeight,
    gmRarity,
    setGmRarity,
    showRarityPicker,
    setShowRarityPicker,
    costValid,
    canConfirm,
    resetAssignedItemMeta,
  } = useAssignedItemMeta({ requiresWeight: pendingNeedsWeight, requiresRarity: true });

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
      setPending(ref);
      resetAssignedItemMeta();
      return;
    }
    return onSelect(ref);
  }

  function handleAssignedBack() {
    setPending(null);
    resetAssignedItemMeta();
  }

  async function handleConfirm() {
    if (!pending || !canConfirm) return;
    await onSelect(
      pending,
      formatMoneyInput(gmCost),
      gmRarity,
      pendingNeedsWeight ? formatWeightInput(gmWeight) : undefined
    );
    handleAssignedBack();
  }

  if (pending) {
    return (
      <AssignedItemMetaScreen
        title="GM-Assigned Values"
        itemName={pending.name}
        explanation={
          pendingNeedsWeight
            ? "has no standard cost, availability, or weight. Enter the values the GM has assigned."
            : "has no standard cost or availability. Enter the values the GM has assigned."
        }
        gmCost={gmCost}
        setGmCost={setGmCost}
        costValid={costValid}
        costPlaceholder="e.g. 5000"
        requiresWeight={pendingNeedsWeight}
        gmWeight={gmWeight}
        setGmWeight={setGmWeight}
        requiresRarity
        gmRarity={gmRarity}
        setGmRarity={setGmRarity}
        showRarityPicker={showRarityPicker}
        setShowRarityPicker={setShowRarityPicker}
        idPrefix="archeotech-assigned-meta"
        confirmLabel="Add to Inventory"
        canConfirm={canConfirm}
        onBack={handleAssignedBack}
        onClose={onClose}
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
          <PickerCustomAction onClick={onCustom}>Add Custom Archeotech Item</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) =>
          entry.kind === "custom" ? (
            <PickerRow
              key={`custom-${entry.item.id}`}
              interactive={editable}
              onClick={() => onSelectCustomItem?.(entry.item)}
            >
              <PickerRowName
                name={entry.item.name}
                status={entry.item.status}
                infoTitle={entry.item.name}
                information={
                  entry.item.data.description ? (
                    <InfoParagraph>{entry.item.data.description}</InfoParagraph>
                  ) : undefined
                }
              />
              <PickerRowChips className="text-xs lg:text-sm">
                {entry.item.data.type && <Chip colour="slate">{entry.item.data.type}</Chip>}
                <ItemMetaChips
                  bare
                  weight={entry.item.data.weight}
                  value={entry.item.data.value}
                  availability={entry.item.data.availability}
                  source={entry.item.data.source}
                />
              </PickerRowChips>
              {entry.item.data.specialRules && (
                <PickerRowLine label="Qualities" value={entry.item.data.specialRules} />
              )}
              <PickerRowRulesLine name={entry.item.name} rules={entry.item.data.rules} />
            </PickerRow>
          ) : (
            <PickerRow
              key={entry.ref.id}
              interactive={editable}
              opensScreen={needsGmInput(entry.ref)}
              onClick={() => handleRowClick(entry.ref)}
            >
              <PickerRowName
                name={entry.ref.name}
                infoTitle={entry.ref.name}
                information={
                  entry.ref.description ? (
                    <InfoParagraph>{entry.ref.description}</InfoParagraph>
                  ) : undefined
                }
              />
              <PickerRowChips className="text-xs lg:text-sm">
                <Chip colour="slate">{entry.ref.type}</Chip>
                <ItemMetaChips
                  bare
                  weight={entry.ref.weight}
                  value={isVariableMeta(entry.ref.value) ? undefined : entry.ref.value}
                  availability={
                    isVariableMeta(entry.ref.availability) ? undefined : entry.ref.availability
                  }
                  source={entry.ref.source}
                />
                {needsGmInput(entry.ref) && (
                  <span className={uiTextGMNote}>GM determines cost &amp; availability</span>
                )}
              </PickerRowChips>
              {entry.ref.specialRules && (
                <PickerRowLine label="Qualities" value={entry.ref.specialRules} />
              )}
              <PickerRowRulesLine name={entry.ref.name} rules={entry.ref.rules} />
            </PickerRow>
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
