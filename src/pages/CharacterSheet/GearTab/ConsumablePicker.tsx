// src/pages/CharacterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { CONSUMABLES_REFERENCE, type ConsumableRef } from "../../../data/reference/consumablesReference";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerCustomAction, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { uiTextBody, uiItemName, uiInfoModalWrapper } from "../../../ui/styles/editableStyles";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/chips/StatusBadge";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"consumable">[];
  onSelect: (ref: ConsumableRef) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"consumable">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
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
  const [query, setQuery] = useState("");
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
          <PickerCustomAction
            onClick={onCustom}
          >
            + Add custom consumable
          </PickerCustomAction>
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
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{entry.item.data.description}</p>}
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
        <PickerRow
          key={entry.ref.id}
          interactive={editable}
          onClick={() => onSelect(entry.ref)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {entry.ref.name}
            </span>
            {entry.ref.description && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={entry.ref.name}
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{entry.ref.description}</p>}
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              weight={entry.ref.weight}
              value={entry.ref.value}
              availability={entry.ref.availability}
              source={entry.ref.source}
            />
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
