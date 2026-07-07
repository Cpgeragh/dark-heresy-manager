// src/pages/characterSheet/weapons/CyberneticWeaponCard.tsx
// Read-only card for weapons granted by cybernetic implants.

import { useState } from "react";
import type { CyberneticWeapon } from "../../../data/reference/cyberneticsReference";
import type { WeaponCraftsmanship } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { Chip } from "../../../ui/Chip";
import { uiTextLabel, uiTextMuted, uiTextPlaceholder, uiCardTitle, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { uiExpandButton } from "../../../ui/buttonStyles";
import { colourCyanDark, colourOrange } from "../../../ui/colourTokens";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  computeMeleeTotalDamage,
} from "./weaponShared";
import { weaponClassChip, rangedCraftsmanshipDescription, meleeCraftsmanshipDescription } from "./weaponHelpers";
import { rangedRulesForCraftsmanship, meleeDamageForCraftsmanship } from "../../../utils/weaponUtils";

export function CyberneticWeaponCard({
  cyberneticName,
  weapon,
  craftsmanship,
  strengthBonus,
}: {
  cyberneticName: string;
  weapon: CyberneticWeapon;
  craftsmanship: WeaponCraftsmanship;
  strengthBonus: number;
}) {
  const effectiveSpecialRules =
    weapon.type === "ranged"
      ? rangedRulesForCraftsmanship(weapon.specialRules ?? "", craftsmanship)
      : weapon.specialRules;
  const effectiveDamage =
    weapon.type === "melee" && weapon.damage
      ? meleeDamageForCraftsmanship(weapon.damage, craftsmanship)
      : weapon.damage;
  const hasRules = !!effectiveSpecialRules?.trim();
  const ruleNamesInLookup = (effectiveSpecialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-cyan-700/40 bg-cyan-900/10 rounded-lg p-3 lg:p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <button className={uiExpandButton} onClick={() => setExpanded((e) => !e)}>
          <div className="flex items-center gap-2">
            <p className={uiCardTitle}>{weapon.name}</p>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={colourCyanDark}>
              Cybernetic
            </Chip>
            {weapon.class === "Melee" ? (
              <Chip size="sm" className={colourOrange}>Melee</Chip>
            ) : weapon.class ? (
              (() => { const c = weaponClassChip(weapon.class); return c ? (
                <Chip size="sm" className={c.active}>{c.label}</Chip>
              ) : null; })()
            ) : null}
          </div>
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-slate-400 hover:text-slate-200 transition shrink-0"
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

      {expanded && (
      <>
      <div className="flex flex-wrap gap-1.5">
        {weapon.type === "ranged" && weapon.range && (
          <StatChip label="Range" value={weapon.range} />
        )}
        {weapon.type === "ranged" && weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
        {effectiveDamage && (
          <StatChip label="Damage" value={effectiveDamage.replace(/\s*[IREX]$/i, "").trim()} />
        )}
        {effectiveDamage && <DamageTypeChip damage={effectiveDamage} />}
        {weapon.pen && <StatChip label="Pen" value={weapon.pen} />}
        {weapon.type === "ranged" && weapon.clip && <StatChip label="Clip" value={weapon.clip} />}
        {weapon.type === "ranged" && weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
        {weapon.type === "melee" && (
          <>
            <StatChip label="SB" value={`+${strengthBonus}`} />
            {effectiveDamage && (
              <StatChip
                label="Total"
                value={computeMeleeTotalDamage(effectiveDamage, strengthBonus)}
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Gained From</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{cyberneticName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Qualities</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
            {hasRules ? effectiveSpecialRules : "-"}
          </span>
          {ruleNamesInLookup.length > 0 && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={`${weapon.name} Qualities`}
                content={<SpecialRulesContent rules={effectiveSpecialRules ?? ""} />}
              />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Rules</span>
          <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Craftsmanship</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
          <span className={uiInfoModalWrapper}>
            <InfoModal
              title={`${craftsmanship} Weapon`}
              content={
                weapon.type === "ranged"
                  ? rangedCraftsmanshipDescription(craftsmanship)
                  : meleeCraftsmanshipDescription(craftsmanship)
              }
            />
          </span>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
