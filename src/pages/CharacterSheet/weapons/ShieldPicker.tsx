// src/pages/CharacterSheet/weapons/ShieldPicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { SHIELD_REFERENCE, type ShieldRef } from "../../../data/reference/weaponReference";
import {
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiInfoModalWrapper,
  uiItemName,
} from "../../../ui/styles/editableStyles";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerCustomAction, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent } from "./weaponShared";

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
                <div className="flex items-center gap-1.5">
                  <span className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}>
                    {item.name}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <StatChip size="sm" label="AP" value={String(data.ap)} />
                  {data.locations && <StatChip size="sm" label="Location" value={data.locations} />}
                  {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
                  {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
                  {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <ItemMetaChips
                    weight={data.weight}
                    value={data.value}
                    availability={data.availability}
                    source={data.source}
                  />
                </div>
                {data.specialRules && data.specialRules !== "—" && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={uiTextLabel}>Qualities</span>
                    <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                      {data.specialRules}
                    </span>
                    <span className={uiInfoModalWrapper}>
                      <InfoModal
                        title={`${data.name} Qualities`}
                        content={<SpecialRulesContent rules={data.specialRules} />}
                        as="span"
                      />
                    </span>
                  </div>
                )}
                {data.notes && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={uiTextLabel}>Rules</span>
                    <span className={uiInfoModalWrapper}>
                      <InfoModal
                        title={data.name}
                        content={
                          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                            {data.notes}
                          </p>
                        }
                        as="span"
                      />
                    </span>
                  </div>
                )}
              </PickerRow>
            ),
          };
        }),
        ...filtered.map((ref) => ({
          name: ref.name,
          row: (
            <PickerRow key={ref.id} interactive={editable} onClick={() => onSelect(ref)}>
              <span className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}>
                {ref.name}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <StatChip size="sm" label="AP" value={String(ref.ap)} />
                {ref.locations && <StatChip size="sm" label="Location" value={ref.locations} />}
                {ref.damage && <StatChip size="sm" label="Dmg" value={ref.damage} />}
                {ref.damage && <DamageTypeChip size="sm" damage={ref.damage} />}
                <StatChip size="sm" label="Pen" value={String(ref.pen)} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <ItemMetaChips
                  weight={ref.weight}
                  value={ref.value}
                  availability={ref.availability}
                  source={ref.source}
                />
              </div>
              {ref.specialRules && ref.specialRules !== "—" && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={uiTextLabel}>Qualities</span>
                  <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                    {ref.specialRules}
                  </span>
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title={`${ref.name} Qualities`}
                      content={<SpecialRulesContent rules={ref.specialRules} />}
                      as="span"
                    />
                  </span>
                </div>
              )}
              {ref.notes && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={uiTextLabel}>Rules</span>
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title={ref.name}
                      content={
                        <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                          {ref.notes}
                        </p>
                      }
                      as="span"
                    />
                  </span>
                </div>
              )}
            </PickerRow>
          ),
        })),
      ]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((entry) => entry.row)}
    </PickerModal>
  );
}
