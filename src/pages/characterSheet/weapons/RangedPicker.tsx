// src/pages/characterSheet/weapons/RangedPicker.tsx

import { useState } from "react";
import type { WeaponCraftsmanship } from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiInfoModalWrapper,
  uiItemName,
} from "../../../ui/editableStyles";
import { colourAmberFaint, colourFuchsia } from "../../../ui/colourTokens";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip, SpecialRulesContent } from "./weaponShared";
import {
  WEAPON_CRAFTSMANSHIP_OPTIONS,
  WEAPON_CRAFTSMANSHIP_STYLE,
  weaponClassChip,
  ammoFamilyChip,
  rangedCraftsmanshipDescription,
} from "./weaponHelpers";

export function RangedPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  references = RANGED_WEAPON_REFERENCE,
  title = "Add Ranged Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  customItems?: CampaignCustomItem<"weapon">[];
  onSelect: (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: RangedWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RangedWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const normalisedQuery = query.toLowerCase();
  const families = Array.from(
    new Map(
      references
        .map((r) => ammoFamilyChip(r.ammoType))
        .filter((f): f is NonNullable<typeof f> => f !== undefined)
        .map((f) => [f.label, f])
    ).values()
  );
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(normalisedQuery))
    .filter((r) => !classFilter || r.class.includes(classFilter))
    .filter((r) => !familyFilter || ammoFamilyChip(r.ammoType)?.label === familyFilter)
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.data.weaponKind === "ranged")
    .filter((item) => item.name.toLowerCase().includes(normalisedQuery))
    .filter((item) => {
      if (item.data.weaponKind !== "ranged") return false;
      return !classFilter || item.data.class?.includes(classFilter);
    })
    .filter((item) => {
      if (item.data.weaponKind !== "ranged") return false;
      return !familyFilter || ammoFamilyChip(item.data.ammoType)?.label === familyFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const modalTitle = editable ? title : title.replace(/^Add\b/, "View");

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        titleClassName="text-slate-200"
        closeLabel="←"
        query=""
        onQueryChange={() => {}}
        onClose={resetPicker}
        isEmpty={false}
        hideSearch
        footer={
          <Button className="w-full" onClick={() => onSelect(selected, craftsmanship)}>
            Add Weapon
          </Button>
        }
      >
        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {WEAPON_CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === q
                      ? WEAPON_CRAFTSMANSHIP_STYLE[q]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {rangedCraftsmanshipDescription(craftsmanship)}
          </div>
        </div>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={modalTitle}
      placeholder={placeholder}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      filterRow={
        <div className="flex gap-2 w-full">
          <select
            value={classFilter ?? ""}
            onChange={(e) => setClassFilter(e.target.value || null)}
            className="flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="">All Classes</option>
            {(["Pistol", "Basic", "Heavy", "Thrown", "Exotic"] as const).map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={familyFilter ?? ""}
            onChange={(e) => setFamilyFilter(e.target.value || null)}
            className="flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="">All Types</option>
            {families.map((f) => (
              <option key={f.label} value={f.label}>{f.label}</option>
            ))}
          </select>
        </div>
      }
      footer={
        editable && showCustom ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom weapon
          </button>
        ) : undefined
      }
    >
      {filteredCustom.map((item) => {
        const data = item.data;
        if (data.weaponKind !== "ranged") return null;
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={editable ? 0 : -1}
            onClick={editable ? () => onSelectCustomItem?.(item) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <span
              className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
            >
              {item.name}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.range && <StatChip size="sm" label="Range" value={data.range} />}
              {data.rof && <StatChip size="sm" label="ROF" value={data.rof} />}
              {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
              {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
              {data.clip && <StatChip size="sm" label="Clip" value={data.clip} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(() => { const c = weaponClassChip(data.class); return c ? (
                <Chip size="sm" className={c.active}>{c.label}</Chip>
              ) : null; })()}
              {(() => { const f = ammoFamilyChip(data.ammoType); return f ? (
                <Chip size="sm" className={f.className}>{f.label}</Chip>
              ) : null; })()}
              {item.status === "draft" && (
                <Chip size="sm" className={colourAmberFaint}>
                  Draft
                </Chip>
              )}
              <Chip size="sm" className={colourFuchsia}>
                Custom
              </Chip>
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
            </div>
          </div>
        );
      })}
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => setSelected(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`${uiItemName} ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <StatChip size="sm" label="Range" value={ref.range} />
            <StatChip size="sm" label="ROF" value={ref.rof} />
            <StatChip size="sm" label="Dmg" value={ref.damage} />
            <StatChip size="sm" label="Pen" value={ref.pen} />
            <StatChip size="sm" label="Clip" value={ref.clip} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(() => { const c = weaponClassChip(ref.class); return c ? (
              <Chip size="sm" className={c.active}>{c.label}</Chip>
            ) : null; })()}
            {(() => { const f = ammoFamilyChip(ref.ammoType); return f ? (
              <Chip size="sm" className={f.className}>{f.label}</Chip>
            ) : null; })()}
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
                <InfoModal title={ref.name} content={<SpecialRulesContent rules="" description={ref.description} />} />
              </span>
            </div>
          )}
        </div>
      ))}
    </PickerModal>
  );
}
