// src/pages/CharacterSheet/weapons/GrenadePicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { GRENADE_REFERENCE, type GrenadeRef } from "../../../data/reference/weaponReference";
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
import { Chip } from "../../../ui/chips/Chip";
import { colourCyan, colourOrange, colourViolet, colourTealLight } from "../../../ui/styles/colourTokens";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent } from "./weaponShared";
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
          <PickerCustomAction
            onClick={onCustom}
          >
            + Add custom grenade or mine
          </PickerCustomAction>
        ) : undefined
      }
    >
      {[
        ...filteredCustomLibraryItems.map((item) => {
        const data = item.data;
        if (data.weaponKind !== "grenade") return { name: item.name, row: null };
        return { name: item.name, row: (
          <PickerRow
            key={`custom-${item.id}`}
            interactive={editable}
            onClick={() => onSelectCustom?.(item)}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
              >
                {item.name}
              </span>
              <StatusBadge status={item.status} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Chip size="sm" className={data.type === "Mine" ? colourViolet : data.type === "Missile" ? colourOrange : colourCyan}>
                {data.type ?? "Grenade"}
              </Chip>
              {(() => { const c = weaponClassChip(data.class); return c ? (
                <Chip size="sm" className={c.label === "Exotic" ? colourTealLight : c.active}>{c.label}</Chip>
              ) : null; })()}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.type !== "Mine" && data.type !== "Missile" && <StatChip size="sm" label="Range" value={thrownRange} />}
              {data.damage && data.damage !== "—" && <StatChip size="sm" label="Dmg" value={data.damage} />}
              {data.damage && <DamageTypeChip size="sm" damage={data.damage} />}
              {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
            </div>
            {data.specialRules && data.specialRules !== "—" && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={uiTextLabel}>Qualities</span>
                <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{data.specialRules}</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title={`${data.name} Qualities`} content={<SpecialRulesContent rules={data.specialRules} />} as="span" />
                </span>
              </div>
            )}
            {data.description && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={uiTextLabel}>Rules</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title={data.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{data.description}</p>} as="span" />
                </span>
              </div>
            )}
          </PickerRow>
        ) };
      }),
      ...filtered.map((ref) => ({ name: ref.name, row: (
        <PickerRow
          key={ref.id}
          interactive={editable}
          onClick={() => onSelect(ref)}
        >
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Chip size="sm" className={ref.type === "Mine" ? colourViolet : ref.type === "Missile" ? colourOrange : colourCyan}>
              {ref.type ?? "Grenade"}
            </Chip>
            {(() => { const c = weaponClassChip(ref.class); return c ? (
              <Chip size="sm" className={c.label === "Exotic" ? colourTealLight : c.active}>{c.label}</Chip>
            ) : null; })()}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ref.type !== "Mine" && ref.type !== "Missile" && <StatChip size="sm" label="Range" value={thrownRange} />}
            {ref.damage !== "—" && <StatChip size="sm" label="Dmg" value={ref.damage} />}
            <DamageTypeChip size="sm" damage={ref.damage} />
            <StatChip size="sm" label="Pen" value={ref.pen} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
          </div>
          {ref.specialRules && ref.specialRules !== "—" && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{ref.specialRules}</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} as="span" />
              </span>
            </div>
          )}
          {ref.description && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={uiTextLabel}>Rules</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={ref.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>} as="span" />
              </span>
            </div>
          )}
        </PickerRow>
      ) })),
      ].sort((a, b) => a.name.localeCompare(b.name)).map((entry) => entry.row)}
    </PickerModal>
  );
}
