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
import { StatChip, DamageTypeChip, SpecialRulesModal } from "./weaponShared";

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
  const [showRules, setShowRules] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const ref = GRENADE_REFERENCE.find((r) => r.id === item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const hasInfo = !!(ref?.description);

  return (
    <div className={sectionContainerClass(editable) + " space-y-2"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          <p className="text-xs text-slate-500">Thrown · Range SBx3</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasInfo && (
            <button
              onClick={() => setShowInfo(true)}
              title="View rules"
              className="text-slate-500 hover:text-slate-300 text-sm transition"
            >
              ⓘ
            </button>
          )}
          {editable && (
            <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300">
              Remove
            </button>
          )}
        </div>
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

      {/* Special rules */}
      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">{item.specialRules}</span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

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

      {showRules && item.specialRules && (
        <SpecialRulesModal
          rules={item.specialRules}
          onClose={() => setShowRules(false)}
        />
      )}

      {showInfo && ref?.description && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-slate-300 leading-relaxed">{ref.description}</p>
            </div>
            <div className="px-4 py-3 border-t border-slate-700">
              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
