// src/pages/characterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { CONSUMABLES_REFERENCE, type ConsumableRef } from "../../../data/reference/consumablesReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { uiTextBody, uiItemName, uiInfoModalWrapper } from "../../../ui/editableStyles";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/StatusBadge";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"consumable">[];
  onSelect: (ref: ConsumableRef) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"consumable">) => void;
  onCustom?: () => void;
  onClose: () => void;
}

export function ConsumablePicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
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

  return (
    <PickerModal
      title={editable ? "Add Consumable" : "View Consumables"}
      placeholder="Search consumables…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
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
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.data.description}</p>}
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
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
        <PickerRow
          key={ref.id}
          interactive={editable}
          onClick={() => onSelect(ref)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {ref.name}
            </span>
            {ref.description && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={ref.name}
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>}
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              weight={ref.weight}
              value={ref.value}
              availability={ref.availability}
              source={ref.source}
            />
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
