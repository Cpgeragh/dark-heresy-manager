// src/pages/characterSheet/weapons/GrenadeCard.tsx
// GrenadePicker and GrenadeCard — co-located for navigability.

import { useState, useEffect } from "react";
import type { GrenadeItem } from "../../../types/Character";
import { GRENADE_REFERENCE, type GrenadeRef } from "../../../data/reference/weaponReference";
import { uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { PickerModal } from "../../../ui/PickerModal";
import { rarityColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";

export const EXPLOSIVE_MISHAPS_CONTENT = (
  <div className="space-y-3">
    <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
      Whenever a jam results from throwing a grenade or firing a grenade, something unfortunate has
      happened. Roll on the table below to find out the results.
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm lg:text-base border-collapse">
        <thead>
          <tr className="text-xs lg:text-sm uppercase tracking-wide text-slate-500 border-b border-slate-700">
            <th className="py-1.5 pr-3 font-medium">Roll</th>
            <th className="py-1.5 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/60">
          <tr>
            <td className="py-2 pr-3 align-top font-mono text-slate-300 whitespace-nowrap">1-5</td>
            <td className="py-2 text-slate-300">
              <span className="font-semibold text-slate-100">Dud.</span> The explosive or round
              fails to explode and, in the case of grenade launchers, the weapon must be reloaded
              before it can fire.
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-3 align-top font-mono text-slate-300 whitespace-nowrap">6-8</td>
            <td className="py-2 text-slate-300">
              <span className="font-semibold text-slate-100">"It might be ok…"</span> Nothing
              happens. Roll again on this table next round.
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-3 align-top font-mono text-slate-300 whitespace-nowrap">9-0</td>
            <td className="py-2 text-slate-300">
              <span className="font-semibold text-slate-100">BOOM!</span> The round or explosive
              detonates immediately. Centre the effect on the character. If this was the result of
              firing a grenade launcher, the grenade detonates in the barrel, having its normal
              effect as well as destroying the weapon.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Grenade Picker ───────────────────────────────────────────────────────────

export function GrenadePicker({
  editable = true,
  onSelect,
  onClose,
}: {
  editable?: boolean;
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
        <p className="text-xs lg:text-sm text-slate-500 italic">
          Range for all thrown grenades: SBx3 (Strength Bonus × 3 metres)
        </p>
      }
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
          <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap font-mono">
            <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            <span className="text-amber-400/80">₮ {ref.value}</span>
            <span className="text-slate-500">{ref.damage !== "—" ? ref.damage : "No damage"}</span>
            <span className="text-slate-500">Pen {ref.pen}</span>
            <span className="text-slate-500">{ref.specialRules}</span>
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
  isEquipped = false,
  onToggleEquip,
  canEquipMoreTypes = true,
  isStowedCard = false,
}: {
  item: GrenadeItem;
  editable: boolean;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  canEquipMoreTypes?: boolean;
  isStowedCard?: boolean;
}) {
  const [expanded, setExpanded] = useState(!isStowedCard && isEquipped);
  useEffect(() => {
    if (!isStowedCard) setExpanded(isEquipped);
  }, [isEquipped, isStowedCard]);

  // ── Stowed overflow card — read-only, always collapsed ────────────────────
  if (isStowedCard) {
    return (
      <div className={uiSection + " opacity-60"}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm lg:text-base font-semibold text-slate-400 truncate">{item.name}</p>
            <p className="text-xs lg:text-sm text-slate-500">Stowed · {item.quantity} remaining</p>
          </div>
          <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
            Stowed
          </span>
        </div>
      </div>
    );
  }

  // ── Regular card ──────────────────────────────────────────────────────────
  const ref = GRENADE_REFERENCE.find((r) => r.id === item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const hasInfo = !!ref?.description;
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const equippedCount = isEquipped ? Math.min(item.quantity, 3) : item.quantity;
  const showMishaps = item.type !== "Mine";

  return (
    <div className={uiSection + " space-y-2"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded((e) => !e)}>
          <p className="text-sm lg:text-base font-semibold text-slate-200 truncate">{item.name}</p>
          <p className="text-xs lg:text-sm text-slate-500">
            {isEquipped ? `${equippedCount} ready · Range SBx3` : "Thrown · Range SBx3"}
          </p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={!isEquipped && !canEquipMoreTypes}
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
          {/* Stat chips */}
          {((item.damage && item.damage !== "—") || (item.pen && item.pen !== "—")) && (
            <div className="flex flex-wrap gap-1.5">
              {item.damage && item.damage !== "—" && item.damage !== "Special" && (
                <>
                  <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
                  <DamageTypeChip damage={item.damage} />
                </>
              )}
              {item.damage === "Special" && (
                <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
                  <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Damage</span>
                  <span className="text-sm lg:text-base font-mono text-amber-400 mt-0.5">Special</span>
                </div>
              )}
              {item.pen && item.pen !== "—" && <StatChip label="Pen" value={item.pen} />}
            </div>
          )}

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Qualities</span>
              <span className="text-xs lg:text-sm text-slate-400 italic">
                {hasRules ? item.specialRules : "-"}
              </span>
              {ruleNamesInLookup.length > 0 && (
                <InfoModal
                  title={`${item.name} Qualities`}
                  content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Rules</span>
              {hasInfo ? (
                <InfoModal
                  title={`${item.name} Rules`}
                  content={
                    <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{ref!.description}</p>
                  }
                />
              ) : (
                <span className="text-xs lg:text-sm text-slate-600 italic">-</span>
              )}
            </div>
            {showMishaps && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Mishaps</span>
                <InfoModal title="Explosive Mishaps" content={EXPLOSIVE_MISHAPS_CONTENT} />
              </div>
            )}
          </div>

          {/* Quantity row */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs lg:text-sm text-slate-400 uppercase tracking-wide">Qty</span>
            <QuantityControl
              quantity={item.quantity}
              editable={editable}
              size="lg"
              onUpdate={onUpdateQty}
            />
            {isEquipped && item.quantity > 3 && (
              <span className="text-[10px] lg:text-xs text-slate-500 italic ml-1">3 ready, rest stowed</span>
            )}
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
