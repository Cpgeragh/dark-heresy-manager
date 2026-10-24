// src/pages/CharacterSheet/GearTab/ConsumablePicker.tsx

import { useState } from "react";
import {
  CONSUMABLES_REFERENCE,
  type ConsumableRef,
} from "../../../data/reference/consumablesReference";
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
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"consumable">[];
  onSelect: (ref: ConsumableRef) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"consumable">) => void | Promise<boolean | void>;
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
  recordComponentRender("ConsumablePicker");
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
          <PickerCustomAction onClick={onCustom}>Add Custom Consumable</PickerCustomAction>
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
              onClick={() => onSelect(entry.ref)}
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
                  value={entry.ref.value}
                  availability={entry.ref.availability}
                  source={entry.ref.source}
                />
              </PickerRowChips>
              <PickerRowRulesLine name={entry.ref.name} rules={entry.ref.rules} />
            </PickerRow>
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
