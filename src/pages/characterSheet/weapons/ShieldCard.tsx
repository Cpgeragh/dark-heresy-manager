// src/pages/characterSheet/weapons/ShieldCard.tsx
// ShieldPicker and ShieldCard — co-located for navigability.

import { useState, useEffect } from "react";
import type { ShieldItem } from "../../../types/Character";
import { SHIELD_REFERENCE, type ShieldRef } from "../../../data/reference/weaponReference";
import { uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";

// ─── Shield Picker ────────────────────────────────────────────────────────────

export function ShieldPicker({
  editable = true,
  onSelect,
  onClose,
}: {
  editable?: boolean;
  onSelect: (ref: ShieldRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = SHIELD_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Shield" : "View Shields"}
      placeholder="Search shields…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs lg:text-sm text-slate-500 mt-0.5 flex-wrap font-code">
            <span className="text-cyan-400">AP {ref.ap}</span>
            <span>{ref.locations}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
            <span>{ref.specialRules}</span>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Shield Card ──────────────────────────────────────────────────────────────

export function ShieldCard({
  item,
  editable,
  onRemove,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
}: {
  item: ShieldItem;
  editable: boolean;
  onRemove: () => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className={uiSection + " space-y-3"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded((e) => !e)}>
          <p className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</p>
          <p className="text-xs lg:text-sm text-slate-500">
            Shield{item.locations ? ` · ${item.locations}` : ""}
          </p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-slate-400 hover:text-slate-200 transition"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {editable && expanded && (
            <button onClick={onRemove} className="text-xs lg:text-sm text-red-400 hover:text-red-300 shrink-0">
              Remove
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {/* Stats — AP chip in cyan to distinguish from weapon damage */}
          <div className="flex flex-wrap gap-1.5">
            <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
              <span className="text-[10px] lg:text-xs text-cyan-500 uppercase tracking-wide">AP</span>
              <span className="text-sm lg:text-base font-code text-cyan-300 mt-0.5">{item.ap}</span>
            </div>
            {item.damage && (
              <StatChip label="Bash" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {item.damage && <DamageTypeChip damage={item.damage} />}
            {item.pen && <StatChip label="Pen" value={item.pen} />}
          </div>

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Qualities</span>
              <span className="text-xs lg:text-sm text-slate-400 italic">
                {hasRules ? item.specialRules : "-"}
              </span>
              {ruleNamesInLookup.length > 0 && (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Rules</span>
              {item.notes ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={<p className="text-sm lg:text-base text-slate-300 leading-relaxed">{item.notes}</p>}
                  />
                </span>
              ) : (
                <span className="text-xs lg:text-sm text-slate-600 italic">-</span>
              )}
            </div>
          </div>

          {/* Weight / Value / Rarity / Source */}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            rarity={item.rarity}
            source={item.source}
            valueAmber
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </>
      )}
    </div>
  );
}
