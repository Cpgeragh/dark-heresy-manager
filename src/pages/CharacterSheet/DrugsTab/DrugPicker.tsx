// src/pages/CharacterSheet/DrugsTab/DrugPicker.tsx

import { useState } from "react";
import { DRUGS_REFERENCE, type DrugRef } from "../../../data/reference/drugsReference";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
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
import { InfoParagraph, InfoSection } from "../../../ui/InfoSection";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { recordComponentRender } from "../../../performance/performanceMetrics";

function drugInfoContent(ref: DrugRef) {
  return (
    <>
      {ref.duration && (
        <InfoSection heading="Duration">
          <InfoParagraph>{ref.duration}</InfoParagraph>
        </InfoSection>
      )}
      {ref.effect && (
        <InfoSection heading="Effect">
          <InfoParagraph>{ref.effect}</InfoParagraph>
        </InfoSection>
      )}
      {ref.sideEffect && (
        <InfoSection heading="Side Effects">
          <InfoParagraph>{ref.sideEffect}</InfoParagraph>
        </InfoSection>
      )}
      {ref.notes && (
        <InfoSection heading="Notes">
          <InfoParagraph>{ref.notes}</InfoParagraph>
        </InfoSection>
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
  onSelect: (ref: DrugRef) => void | Promise<boolean | void>;
  onSelectCustomItem?: (item: CampaignCustomItem<"drug">) => void | Promise<boolean | void>;
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
          <PickerCustomAction onClick={onCustom}>Add Custom Drug</PickerCustomAction>
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
                  status={item.status}
                  infoTitle={item.name}
                  information={
                    item.data.notes ? <InfoParagraph>{item.data.notes}</InfoParagraph> : undefined
                  }
                />
                <PickerRowChips>
                  <ItemMetaChips
                    bare
                    weight={item.data.weight}
                    value={item.data.value}
                    availability={item.data.availability}
                    source={item.data.source}
                  />
                </PickerRowChips>
                <PickerRowRulesLine name={item.name} rules={item.data.rules} />
              </PickerRow>
            );
          }

          const ref = entry.ref;
          const hasInfo = !!(ref.duration || ref.effect || ref.sideEffect || ref.notes);

          return (
            <PickerRow key={ref.id} interactive={editable} onClick={() => onSelect(ref)}>
              <PickerRowName
                name={ref.name}
                infoTitle={ref.name}
                information={hasInfo ? drugInfoContent(ref) : undefined}
              />
              <PickerRowChips>
                <ItemMetaChips
                  bare
                  weight={ref.weight}
                  value={ref.value}
                  availability={ref.availability}
                  source={ref.source}
                />
              </PickerRowChips>
              {ref.duration && <PickerRowLine label="Duration" value={ref.duration} />}
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
