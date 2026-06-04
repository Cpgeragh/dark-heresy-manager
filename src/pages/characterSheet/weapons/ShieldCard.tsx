// src/pages/characterSheet/weapons/ShieldCard.tsx
// ShieldPicker and ShieldCard — co-located for navigability.
// ShieldPicker converted to PickerModal for consistency.

import { useState } from "react";
import type { ShieldItem } from "../../../types/Character";
import {
  SHIELD_REFERENCE,
  type ShieldRef,
} from "../../../data/reference/weaponReference";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent } from "./weaponShared";

// ─── Shield Picker ────────────────────────────────────────────────────────────

export function ShieldPicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: ShieldRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = SHIELD_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Shield"
      placeholder="Search shields…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={() => onSelect(ref)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </span>
            <span className="text-xs text-cyan-400 shrink-0 font-mono">AP {ref.ap}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {ref.locations} · {ref.damage} · Pen {ref.pen} · {ref.specialRules}
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
}: {
  item: ShieldItem;
  editable: boolean;
  onRemove: () => void;
}) {
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          <p className="text-xs text-slate-500">
            Shield{item.locations ? ` · ${item.locations}` : ""}
          </p>
        </div>
        {editable && (
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* Stats — AP chip in cyan to distinguish from weapon damage */}
      <div className="flex flex-wrap gap-1.5">
        <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
          <span className="text-[10px] text-cyan-500 uppercase tracking-wide">AP</span>
          <span className="text-sm font-mono text-cyan-300 mt-0.5">{item.ap}</span>
        </div>
        {item.damage && (
          <StatChip
            label="Bash"
            value={item.damage.replace(/\s*[IREX]$/i, "").trim()}
          />
        )}
        {item.damage && <DamageTypeChip damage={item.damage} />}
        {item.pen && <StatChip label="Pen" value={item.pen} />}
      </div>

      {/* Qualities / Rules */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Qualities</span>
          <span className="text-xs text-slate-400 italic">{hasRules ? item.specialRules : "-"}</span>
          {ruleNamesInLookup.length > 0 && (
            <InfoModal
              title={`${item.name} Qualities`}
              content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Rules</span>
          {item.notes ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<p className="text-sm text-slate-300 leading-relaxed">{item.notes}</p>}
            />
          ) : (
            <span className="text-xs text-slate-600 italic">-</span>
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

    </div>
  );
}
