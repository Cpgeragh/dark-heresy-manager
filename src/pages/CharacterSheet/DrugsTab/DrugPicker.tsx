// src/pages/CharacterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName, PickerRowText } from "../../../ui/pickers/PickerRowParts";
import { uiTextLabel, uiTextDescription } from "../../../ui/styles/editableStyles";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { colourHeadingAccent } from "../../../ui/styles/colourTokens";

function drugInfoContent(ref: DrugRef) {
  return (
    <>
      {ref.duration && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>Duration</p>
          <p className={uiTextDescription}>{ref.duration}</p>
        </div>
      )}
      {ref.effect && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>Effect</p>
          <p className={uiTextDescription}>{ref.effect}</p>
        </div>
      )}
      {ref.sideEffect && (
        <div>
          <p
            className={`text-xs lg:text-sm font-semibold ${colourHeadingAccent} uppercase tracking-wide mb-1`}
          >
            Side Effects
          </p>
          <p className={uiTextDescription}>{ref.sideEffect}</p>
        </div>
      )}
      {ref.notes && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
          <p className={uiTextDescription}>{ref.notes}</p>
        </div>
      )}
    </>
  );
}

export function DrugPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  customItems?: CampaignCustomItem<"drug">[];
  onSelect: (ref: DrugRef) => void | Promise<void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"drug">) => void | Promise<void>;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  recordComponentRender("DrugPicker");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = DRUGS_REFERENCE.filter((r) =>
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
      title={editable ? "Add Drug" : "View Drugs"}
      placeholder="Search drugs…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom drug</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) => {
          if (entry.kind === "custom") {
            const item = entry.item;
            return (
              <PickerRow
                key={`custom-${item.id}`}
                interactive={editable}
                onClick={() => onSelectCustomItem?.(item)}
              >
                <PickerRowName
                  name={item.name}
                  badges={<StatusBadge status={item.status} />}
                  info={
                    item.data.notes && (
                      <InfoModal
                        title={item.name}
                        content={<p className={uiTextDescription}>{item.data.notes}</p>}
                        as="span"
                      />
                    )
                  }
                />
                <PickerRowChips>
                  <ItemMetaChips
                    bare
                    weight={item.data.weight ?? "0 kg"}
                    value={item.data.value}
                    availability={item.data.availability}
                    source={item.data.source}
                  />
                </PickerRowChips>
              </PickerRow>
            );
          }

          const ref = entry.ref;
          const hasInfo = !!(ref.duration || ref.effect || ref.sideEffect || ref.notes);

          return (
            <PickerRow key={ref.id} interactive={editable} onClick={() => onSelect(ref)}>
              <PickerRowName
                name={ref.name}
                info={
                  hasInfo && <InfoModal title={ref.name} content={drugInfoContent(ref)} as="span" />
                }
              />
              <PickerRowChips>
                <ItemMetaChips
                  bare
                  weight={ref.weight ?? "0 kg"}
                  value={ref.value}
                  availability={ref.availability}
                  source={ref.source}
                />
              </PickerRowChips>
              {ref.duration && <PickerRowText>Duration: {ref.duration}</PickerRowText>}
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
