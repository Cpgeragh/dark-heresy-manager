// src/pages/CharacterSheet/weapons/GrenadePicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { GRENADE_REFERENCE, type GrenadeRef } from "../../../data/reference/weaponReference";
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
import { Chip } from "../../../ui/chips/Chip";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent } from "./weaponShared";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { weaponClassChip } from "./weaponHelpers";

export function GrenadePicker({
  editable = true,
  strengthBonus,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
  suspended = false,
}: {
  editable?: boolean;
  strengthBonus: number;
  customLibraryItems?: CampaignCustomItem<"weapon">[];
  onSelect: (ref: GrenadeRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  recordComponentRender("GrenadePicker");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = GRENADE_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustomLibraryItems = customLibraryItems
    .filter((item) => item.data.weaponKind === "grenade")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const thrownRange = `${Math.max(0, strengthBonus) * 3}m`;

  return (
    <PickerModal
      title={editable ? "Add Explosive" : "View Explosives"}
      placeholder="Search grenades…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustomLibraryItems.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>+ Add custom grenade or mine</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {[
          ...filteredCustomLibraryItems.map((item) => {
            const data = item.data;
            if (data.weaponKind !== "grenade") return { name: item.name, row: null };
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
                    <Chip
                      size="sm"
                      colour={
                        data.type === "Mine"
                          ? "violet"
                          : data.type === "Missile"
                            ? "orange"
                            : "cyan"
                      }
                    >
                      {data.type ?? "Grenade"}
                    </Chip>
                    {(() => {
                      const c = weaponClassChip(data.class);
                      return c ? (
                        <Chip size="sm" colour={c.colour}>
                          {c.label}
                        </Chip>
                      ) : null;
                    })()}
                  </PickerRowChips>
                  <PickerRowChips>
                    {data.type !== "Mine" && data.type !== "Missile" && (
                      <StatChip size="sm" label="Range" value={thrownRange} />
                    )}
                    {data.damage && data.damage !== "—" && (
                      <StatChip size="sm" label="Dmg" value={data.damage} />
                    )}
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
                  {data.description && (
                    <PickerRowInfoLine
                      label="Rules"
                      info={
                        <InfoModal
                          title={data.name}
                          content={<p className={uiTextDescription}>{data.description}</p>}
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
                  <Chip
                    size="sm"
                    colour={
                      ref.type === "Mine" ? "violet" : ref.type === "Missile" ? "orange" : "cyan"
                    }
                  >
                    {ref.type ?? "Grenade"}
                  </Chip>
                  {(() => {
                    const c = weaponClassChip(ref.class);
                    return c ? (
                      <Chip size="sm" colour={c.colour}>
                        {c.label}
                      </Chip>
                    ) : null;
                  })()}
                </PickerRowChips>
                <PickerRowChips>
                  {ref.type !== "Mine" && ref.type !== "Missile" && (
                    <StatChip size="sm" label="Range" value={thrownRange} />
                  )}
                  {ref.damage !== "—" && <StatChip size="sm" label="Dmg" value={ref.damage} />}
                  <DamageTypeChip size="sm" damage={ref.damage} />
                  <StatChip size="sm" label="Pen" value={ref.pen} />
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
                {ref.description && (
                  <PickerRowInfoLine
                    label="Rules"
                    info={
                      <InfoModal
                        title={ref.name}
                        content={<p className={uiTextDescription}>{ref.description}</p>}
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
