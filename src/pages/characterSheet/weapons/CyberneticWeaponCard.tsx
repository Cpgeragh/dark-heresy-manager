// src/pages/characterSheet/weapons/CyberneticWeaponCard.tsx
// Read-only card for weapons granted by cybernetic implants.

import type { CyberneticWeapon } from "../../../data/reference/cyberneticsReference";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { Chip } from "../../../ui/Chip";
import { uiTextLabel, uiTextMuted, uiTextPlaceholder } from "../../../ui/editableStyles";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  computeMeleeTotalDamage,
} from "./weaponShared";

export function CyberneticWeaponCard({
  cyberneticName,
  weapon,
  strengthBonus,
}: {
  cyberneticName: string;
  weapon: CyberneticWeapon;
  strengthBonus: number;
}) {
  const hasRules = !!weapon.specialRules?.trim();
  const ruleNamesInLookup = (weapon.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className="border border-cyan-700/40 bg-cyan-900/10 rounded-lg p-3 lg:p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm lg:text-base font-semibold text-slate-200">{weapon.name}</p>
          <Chip size="sm" className="border-cyan-700/50 bg-cyan-500/10 text-cyan-400 uppercase tracking-wide">
            Cybernetic
          </Chip>
        </div>
        <p className={`text-xs lg:text-sm ${uiTextMuted}`}>
          {cyberneticName}
          {weapon.class ? ` · ${weapon.class}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {weapon.type === "ranged" && weapon.range && (
          <StatChip label="Range" value={weapon.range} />
        )}
        {weapon.type === "ranged" && weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
        {weapon.damage && (
          <StatChip label="Damage" value={weapon.damage.replace(/\s*[IREX]$/i, "").trim()} />
        )}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {weapon.pen && <StatChip label="Pen" value={weapon.pen} />}
        {weapon.type === "ranged" && weapon.clip && <StatChip label="Clip" value={weapon.clip} />}
        {weapon.type === "ranged" && weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
        {weapon.type === "melee" && (
          <>
            <StatChip label="SB" value={`+${strengthBonus}`} />
            {weapon.damage && (
              <StatChip
                label="Total"
                value={computeMeleeTotalDamage(weapon.damage, strengthBonus)}
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Qualities</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
            {hasRules ? weapon.specialRules : "-"}
          </span>
          {ruleNamesInLookup.length > 0 && (
            <span className="inline-flex items-center -translate-y-[1.4px]">
              <InfoModal
                title={`${weapon.name} Qualities`}
                content={<SpecialRulesContent rules={weapon.specialRules ?? ""} />}
              />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Rules</span>
          <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
        </div>
      </div>
    </div>
  );
}
