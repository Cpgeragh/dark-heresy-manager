// src/pages/characterSheet/weapons/ArcheotechWeaponCard.tsx
// Read-only card for weapons, grenades and mines stored in the Archeotech tab.

import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent, computeMeleeTotalDamage } from "./weaponShared";

export function ArcheotechWeaponCard({ item, strengthBonus }: { item: ArcheotechItem; strengthBonus?: number }) {
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const specialRules  = ref?.specialRules;
  const description   = item.description ?? ref?.description;
  const weight        = item.weight  ?? ref?.weight;
  const value         = item.value   ?? ref?.value;
  const rarity        = item.rarity  ?? ref?.rarity;
  const source        = item.source  ?? ref?.source;

  const hasRules = !!(specialRules?.trim());
  const ruleNamesInLookup = (specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const hasWeaponStats = !!(ref?.damage || ref?.weaponClass);

  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          <span className="text-[10px] uppercase tracking-wide text-amber-400 border border-amber-700/50 rounded px-1.5 py-0.5 font-medium">
            Archeotech
          </span>
        </div>
        {ref?.weaponClass && (
          <p className="text-xs text-slate-500">{ref.weaponClass}</p>
        )}
      </div>

      {/* Stat chips — only for items with structured weapon data */}
      {hasWeaponStats && (
        <div className="flex flex-wrap gap-1.5">
          {ref?.range && <StatChip label="Range" value={ref.range} />}
          {ref?.rof   && <StatChip label="RoF"   value={ref.rof} />}
          {ref?.damage && (
            <StatChip
              label="Damage"
              value={ref.damage.replace(/\s*[IREX]$/i, "").trim()}
            />
          )}
          {ref?.damage && <DamageTypeChip damage={ref.damage} />}
          {ref?.pen   && <StatChip label="Pen"   value={ref.pen} />}
          {ref?.clip  && <StatChip label="Clip"  value={ref.clip} />}
          {ref?.rld   && <StatChip label="Reload" value={ref.rld} />}
          {ref?.weaponClass === "Melee" && strengthBonus !== undefined && (
            <>
              <StatChip label="SB" value={`+${strengthBonus}`} />
              {ref?.damage && (
                <StatChip label="Total" value={computeMeleeTotalDamage(ref.damage, strengthBonus)} />
              )}
            </>
          )}
        </div>
      )}

      {/* Qualities / Rules */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Qualities</span>
          <span className="text-xs text-slate-400 italic">{hasRules ? specialRules : "-"}</span>
          {ruleNamesInLookup.length > 0 && (
            <InfoModal
              title={`${item.name} Qualities`}
              content={<SpecialRulesContent rules={specialRules ?? ""} />}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Rules</span>
          {description ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<p className="text-sm text-slate-300 leading-relaxed">{description}</p>}
            />
          ) : (
            <span className="text-xs text-slate-600 italic">-</span>
          )}
        </div>
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
    </div>
  );
}
