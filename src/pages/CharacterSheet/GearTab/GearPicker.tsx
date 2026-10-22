// src/pages/CharacterSheet/GearTab/GearPicker.tsx

import { useRef, useState } from "react";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import {
  PickerRowChips,
  PickerRowName,
  PickerRowRulesLine,
} from "../../../ui/pickers/PickerRowParts";
import { InfoParagraph } from "../../../ui/InfoSection";
import { uiTextGMNote } from "../../../ui/styles/editableStyles";
import { formatMoneyInput } from "../../../ui/format/moneyFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { isVariableMeta } from "../../../data/reference/referenceMeta";
import { useAssignedItemMeta } from "../../../hooks/useAssignedItemMeta";
import { AssignedItemMetaScreen } from "../../../ui/pickers/AssignedItemMetaScreen";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"gear">[];
  onSelect: (ref: GearRef, gmValue?: string, gmRarity?: string) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"gear">) => void | Promise<boolean | void>;
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
  recordComponentRender("GearPicker");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<GearRef | null>(null);
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
    return onSelect(ref);
  }

  function handleAssignedBack() {
    setPending(null);
    resetAssignedItemMeta();
  }

  async function handleConfirm() {
    if (!pending || !canConfirm) return;
    await onSelect(pending, formatMoneyInput(gmCost), pendingNeedsRarity ? gmRarity : undefined);
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
        onClose={onClose}
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
      scrollPositionRef={listScrollPositionRef}
      isEmpty={isEmpty}
      footer={
        editable ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom item</PickerCustomAction>
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
                <ItemMetaChips
                  bare
                  weight={entry.item.data.weight}
                  value={entry.item.data.value}
                  availability={entry.item.data.availability}
                  source={entry.item.data.source}
                />
              </PickerRowChips>
              <PickerRowRulesLine name={entry.item.name} rules={entry.item.data.rules} />
            </PickerRow>
          ) : (
            <PickerRow
              key={entry.ref.id}
              interactive={editable}
              onClick={() => handleSelect(entry.ref)}
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
                <ItemMetaChips
                  bare
                  weight={entry.ref.weight}
                  value={isVariableMeta(entry.ref.value) ? undefined : entry.ref.value}
                  availability={
                    isVariableMeta(entry.ref.availability) ? undefined : entry.ref.availability
                  }
                  source={entry.ref.source}
                />
                {isVariableMeta(entry.ref.value) && (
                  <span className={uiTextGMNote}>Cost assigned on add</span>
                )}
              </PickerRowChips>
              <PickerRowRulesLine name={entry.ref.name} rules={entry.ref.rules} />
            </PickerRow>
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
