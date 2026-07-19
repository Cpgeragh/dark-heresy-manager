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
import { colourPink, colourOrange } from "../../../ui/colourTokens";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  computeMeleeTotalDamage,
} from "./weaponShared";
import { weaponClassChip, rangedCraftsmanshipDescription, meleeCraftsmanshipDescription } from "./weaponHelpers";
import { rangedRulesForCraftsmanship, meleeDamageForCraftsmanship } from "../../../utils/weaponUtils";
import { ExpandChevron } from "../../../ui/ExpandChevron";

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
    <div className="border border-pink-500/60 bg-pink-900/10 rounded-lg p-3 lg:p-4 space-y-3">
      <button
        className="w-full flex items-stretch justify-between gap-2"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={uiExpandButton}>
          <div className="flex items-center gap-2">
            <p className={uiCardTitle}>{weapon.name}</p>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={colourPink}>
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
        </div>
        <ExpandChevron expanded={expanded} />
      </button>

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
