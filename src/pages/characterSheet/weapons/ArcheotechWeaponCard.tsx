// src/pages/characterSheet/weapons/ArcheotechWeaponCard.tsx
// Collapsible card for weapons, grenades and mines stored in the Archeotech tab.

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  computeMeleeTotalDamage,
  EquipToggle,
} from "./weaponShared";
import { EXPLOSIVE_MISHAPS_CONTENT } from "./GrenadeCard";

export function ArcheotechWeaponCard({
  item,
  strengthBonus,
  editable = false,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
}: {
  item: ArcheotechItem;
  strengthBonus?: number;
  editable?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const specialRules = ref?.specialRules;
  const description = item.description ?? ref?.description;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const rarity = item.rarity ?? ref?.rarity;
  const source = item.source ?? ref?.source;

  const hasRules = !!specialRules?.trim();
  const ruleNamesInLookup = (specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const hasWeaponStats = !!(ref?.damage || ref?.weaponClass);
  const showMishaps = item.type === "Grenade";

  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4 space-y-3">
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded((e) => !e)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</p>
            <span className="text-[10px] lg:text-xs uppercase tracking-wide text-amber-400 border border-amber-700/50 rounded px-1.5 lg:px-2 py-0.5 font-medium shrink-0">
              Archeotech
            </span>
          </div>
          {ref?.weaponClass && <p className="text-xs lg:text-sm text-slate-500">{ref.weaponClass}</p>}
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
        </div>
      </div>

      {expanded && (
        <>
          {/* Stat chips — only for items with structured weapon data */}
          {hasWeaponStats && (
            <div className="flex flex-wrap gap-1.5">
              {ref?.range && <StatChip label="Range" value={ref.range} />}
              {ref?.rof && <StatChip label="RoF" value={ref.rof} />}
              {ref?.damage && (
                <StatChip label="Damage" value={ref.damage.replace(/\s*[IREX]$/i, "").trim()} />
              )}
              {ref?.damage && <DamageTypeChip damage={ref.damage} />}
              {ref?.pen && <StatChip label="Pen" value={ref.pen} />}
              {ref?.clip && <StatChip label="Clip" value={ref.clip} />}
              {ref?.rld && <StatChip label="Reload" value={ref.rld} />}
              {ref?.weaponClass === "Melee" && strengthBonus !== undefined && (
                <>
                  <StatChip label="SB" value={`+${strengthBonus}`} />
                  {ref?.damage && (
                    <StatChip
                      label="Total"
                      value={computeMeleeTotalDamage(ref.damage, strengthBonus)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Qualities</span>
              <span className="text-xs lg:text-sm text-slate-400 italic">{hasRules ? specialRules : "-"}</span>
              {ruleNamesInLookup.length > 0 && (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Rules</span>
              {description ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={<p className="text-sm lg:text-base text-slate-300 leading-relaxed">{description}</p>}
                  />
                </span>
              ) : (
                <span className="text-xs lg:text-sm text-slate-600 italic">-</span>
              )}
            </div>
            {showMishaps && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Mishaps</span>
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal title="Explosive Mishaps" content={EXPLOSIVE_MISHAPS_CONTENT} />
                </span>
              </div>
            )}
          </div>

          {/* Weight / Value / Rarity / Source */}
          <ItemMetaChips
            weight={weight}
            value={value}
            rarity={rarity}
            source={source}
            valueAmber
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </>
      )}
    </div>
  );
}
