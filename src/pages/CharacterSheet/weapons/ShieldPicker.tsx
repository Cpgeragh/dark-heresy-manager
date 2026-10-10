// src/pages/CharacterSheet/weapons/ShieldPicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { SHIELD_REFERENCE, type ShieldRef } from "../../../data/reference/weaponReference";
import { uiTextBody, uiTextDescription } from "../../../ui/styles/editableStyles";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import {
  PickerRowChips,
  PickerRowInfoLine,
  PickerRowName,
} from "../../../ui/pickers/PickerRowParts";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent } from "./weaponShared";
import { recordComponentRender } from "../../../performance/performanceMetrics";

export function ShieldPicker({
  editable = true,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  customLibraryItems?: CampaignCustomItem<"armour">[];
  onSelect: (ref: ShieldRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"armour">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  recordComponentRender("ShieldPicker");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = SHIELD_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustomLibraryItems = customLibraryItems
    .filter((item) => item.data.armourKind === "shield")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Shield" : "View Shields"}
      placeholder="Search shields…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustomLibraryItems.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom shield</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {[
          ...filteredCustomLibraryItems.map((item) => {
            const data = item.data;
            if (data.armourKind !== "shield") return { name: item.name, row: null };
            return {
              name: item.name,
              row: (
                <PickerRow
                  key={`custom-${item.id}`}
                  interactive={editable}
                  onClick={() => onSelectCustom?.(item)}
                >
                  <PickerRowName name={item.name} badges={<StatusBadge status={item.status} />} />
                  <PickerRowChips>
                    <StatChip size="sm" label="AP" value={String(data.ap)} />
                    {data.locations && (
                      <StatChip size="sm" label="Location" value={data.locations} />
                    )}
                    {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
                    {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
                    {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
                  </PickerRowChips>
                  <PickerRowChips>
                    <ItemMetaChips
                      weight={data.weight}
                      value={data.value}
                      availability={data.availability}
                      source={data.source}
                    />
                  </PickerRowChips>
                  {data.specialRules && data.specialRules !== "—" && (
                    <PickerRowInfoLine
                      label="Qualities"
                      info={
                        <InfoModal
                          title={`${data.name} Qualities`}
                          content={<SpecialRulesContent rules={data.specialRules} />}
                          as="span"
                        />
                      }
                    >
                      <span className={`text-xs lg:text-sm ${uiTextBody}`}>
                        {data.specialRules}
                      </span>
                    </PickerRowInfoLine>
                  )}
                  {data.notes && (
                    <PickerRowInfoLine
                      label="Rules"
                      info={
                        <InfoModal
                          title={data.name}
                          content={<p className={uiTextDescription}>{data.notes}</p>}
                          as="span"
                        />
                      }
                    />
                  )}
                </PickerRow>
              ),
            };
          }),
          ...filtered.map((ref) => ({
            name: ref.name,
            row: (
              <PickerRow key={ref.id} interactive={editable} onClick={() => onSelect(ref)}>
                <PickerRowName name={ref.name} />
                <PickerRowChips>
                  <StatChip size="sm" label="AP" value={String(ref.ap)} />
                  {ref.locations && <StatChip size="sm" label="Location" value={ref.locations} />}
                  {ref.damage && <StatChip size="sm" label="Dmg" value={ref.damage} />}
                  {ref.damage && <DamageTypeChip size="sm" damage={ref.damage} />}
                  <StatChip size="sm" label="Pen" value={String(ref.pen)} />
                </PickerRowChips>
                <PickerRowChips>
                  <ItemMetaChips
                    weight={ref.weight}
                    value={ref.value}
                    availability={ref.availability}
                    source={ref.source}
                  />
                </PickerRowChips>
                {ref.specialRules && ref.specialRules !== "—" && (
                  <PickerRowInfoLine
                    label="Qualities"
                    info={
                      <InfoModal
                        title={`${ref.name} Qualities`}
                        content={<SpecialRulesContent rules={ref.specialRules} />}
                        as="span"
                      />
                    }
                  >
                    <span className={`text-xs lg:text-sm ${uiTextBody}`}>{ref.specialRules}</span>
                  </PickerRowInfoLine>
                )}
                {ref.notes && (
                  <PickerRowInfoLine
                    label="Rules"
                    info={
                      <InfoModal
                        title={ref.name}
                        content={<p className={uiTextDescription}>{ref.notes}</p>}
                        as="span"
                      />
                    }
                  />
                )}
              </PickerRow>
            ),
          })),
        ]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) => entry.row)}
      </PickerList>
    </PickerModal>
  );
}
