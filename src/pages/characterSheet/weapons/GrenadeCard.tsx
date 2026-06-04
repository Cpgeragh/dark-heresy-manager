// src/pages/characterSheet/weapons/GrenadeCard.tsx
// GrenadePicker and GrenadeCard — co-located for navigability.

import { useState } from "react";
import type { GrenadeItem } from "../../../types/Character";
import {
  GRENADE_REFERENCE,
  type GrenadeRef,
} from "../../../data/reference/weaponReference";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { PickerModal } from "../../../ui/PickerModal";
import { rarityColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent } from "./weaponShared";

// ─── Grenade Picker ───────────────────────────────────────────────────────────

export function GrenadePicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: GrenadeRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = GRENADE_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Grenade"
      placeholder="Search grenades…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      filterRow={
        <p className="text-xs text-slate-500 italic">
          Range for all thrown grenades: SBx3 (Strength Bonus × 3 metres)
        </p>
      }
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
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {ref.damage !== "—" ? ref.damage : "No damage"} · Pen {ref.pen} ·{" "}
            {ref.specialRules}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Grenade Card ─────────────────────────────────────────────────────────────

export function GrenadeCard({
  item,
  editable,
  onRemove,
  onUpdateQty,
}: {
  item: GrenadeItem;
  editable: boolean;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const ref = GRENADE_REFERENCE.find((r) => r.id === item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const hasInfo = !!(ref?.description);
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className={sectionContainerClass(editable) + " space-y-2"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          <p className="text-xs text-slate-500">Thrown · Range SBx3</p>
        </div>
        {editable && (
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* Stat chips */}
      {((item.damage && item.damage !== "—") || (item.pen && item.pen !== "—")) && (
        <div className="flex flex-wrap gap-1.5">
          {item.damage && item.damage !== "—" && item.damage !== "Special" && (
            <>
              <StatChip
                label="Damage"
                value={item.damage.replace(/\s*[IREX]$/i, "").trim()}
              />
              <DamageTypeChip damage={item.damage} />
            </>
          )}
          {item.damage === "Special" && (
            <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                Damage
              </span>
              <span className="text-sm font-mono text-amber-400 mt-0.5">Special</span>
            </div>
          )}
          {item.pen && item.pen !== "—" && (
            <StatChip label="Pen" value={item.pen} />
          )}
        </div>
      )}

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
          {hasInfo ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<p className="text-sm text-slate-300 leading-relaxed">{ref!.description}</p>}
            />
          ) : (
            <span className="text-xs text-slate-600 italic">-</span>
          )}
        </div>
      </div>

      {/* Quantity row */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Qty</span>
        <QuantityControl
          quantity={item.quantity}
          editable={editable}
          size="lg"
          onUpdate={onUpdateQty}
        />
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
