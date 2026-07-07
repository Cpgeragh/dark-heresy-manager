// src/pages/characterSheet/weapons/GrenadePicker.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { StatusBadge } from "../../../ui/StatusBadge";
import { GRENADE_REFERENCE, type GrenadeRef } from "../../../data/reference/weaponReference";
import {
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiInfoModalWrapper,
  uiItemName,
} from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/Chip";
import { colourCyan, colourViolet, colourTealLight } from "../../../ui/colourTokens";
import { StatChip, SpecialRulesContent } from "./weaponShared";
import { weaponClassChip } from "./weaponHelpers";

export function GrenadePicker({
  editable = true,
  strengthBonus,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
}: {
  editable?: boolean;
  strengthBonus: number;
  customLibraryItems?: CampaignCustomItem<"weapon">[];
  onSelect: (ref: GrenadeRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom?: () => void;
  onClose: () => void;
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
      title={editable ? "Add Explosive" : "View Explosive"}
      placeholder="Search grenades…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustomLibraryItems.length === 0}
      footer={
        editable && onCustom ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom grenade or mine
          </button>
        ) : undefined
      }
    >
      {filteredCustomLibraryItems.map((item) => {
        const data = item.data;
        if (data.weaponKind !== "grenade") return null;
        return (
          <div
            key={`custom-${item.id}`}
            role="button"
            tabIndex={editable ? 0 : -1}
            onClick={editable && onSelectCustom ? () => onSelectCustom(item) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
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
              <Chip size="sm" className={data.type === "Mine" ? colourViolet : colourCyan}>
                {data.type === "Mine" ? "Mine" : "Grenade"}
              </Chip>
              {(() => { const c = weaponClassChip(data.class); return c ? (
                <Chip size="sm" className={c.label === "Exotic" ? colourTealLight : c.active}>{c.label}</Chip>
              ) : null; })()}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.type !== "Mine" && <StatChip size="sm" label="Range" value={thrownRange} />}
              {data.damage && data.damage !== "—" && <StatChip size="sm" label="Dmg" value={data.damage} />}
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
                  <InfoModal title={`${data.name} Qualities`} content={<SpecialRulesContent rules={data.specialRules} />} />
                </span>
              </div>
            )}
            {data.description && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={uiTextLabel}>Rules</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title={data.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{data.description}</p>} />
                </span>
              </div>
            )}
          </div>
        );
      })}
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Chip size="sm" className={ref.type === "Mine" ? colourViolet : colourCyan}>
              {ref.type === "Mine" ? "Mine" : "Grenade"}
            </Chip>
            {(() => { const c = weaponClassChip(ref.class); return c ? (
              <Chip size="sm" className={c.label === "Exotic" ? colourTealLight : c.active}>{c.label}</Chip>
            ) : null; })()}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ref.type !== "Mine" && <StatChip size="sm" label="Range" value={thrownRange} />}
            {ref.damage !== "—" && <StatChip size="sm" label="Dmg" value={ref.damage} />}
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
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} />
              </span>
            </div>
          )}
          {ref.description && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={uiTextLabel}>Rules</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={ref.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>} />
              </span>
            </div>
          )}
        </div>
      ))}
    </PickerModal>
  );
}
