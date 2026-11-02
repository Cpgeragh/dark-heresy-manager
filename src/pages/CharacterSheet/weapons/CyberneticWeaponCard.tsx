// src/pages/CharacterSheet/weapons/CyberneticWeaponCard.tsx
// Read-only card for weapons granted by cybernetic implants.

import { useState } from "react";
import type { CyberneticWeapon } from "../../../data/reference/cyberneticsReference";
import type { WeaponCraftsmanship } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow, uiStackField } from "../../../ui/styles/editableStyles";
import { AccordionCard } from "../../../ui/AccordionCard";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent } from "./weaponShared";
import { computeMeleeTotalDamage, getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import {
  weaponClassChip,
  rangedCraftsmanshipDescription,
  meleeCraftsmanshipDescription,
  rangedRulesForCraftsmanship,
  meleeDamageForCraftsmanship,
} from "./weaponHelpers";
import { EntryLines } from "../../../ui/EntryLines";
import { InfoParagraph } from "../../../ui/InfoSection";

export function CyberneticWeaponCard({
  cyberneticName,
  weapon,
  rules,
  craftsmanship,
  strengthBonus,
}: {
  cyberneticName: string;
  weapon: CyberneticWeapon;
  rules?: string;
  craftsmanship: WeaponCraftsmanship;
  strengthBonus: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const effectiveSpecialRules =
    weapon.type === "ranged"
      ? rangedRulesForCraftsmanship(weapon.specialRules ?? "", craftsmanship)
      : weapon.specialRules;
  const effectiveDamage =
    weapon.type === "melee" && weapon.damage
      ? meleeDamageForCraftsmanship(weapon.damage, craftsmanship)
      : weapon.damage;
  const hasRules = !!effectiveSpecialRules?.trim();
  const ruleNamesInLookup = expanded ? getKnownSpecialRuleNames(effectiveSpecialRules) : [];

  return (
    <AccordionCard
      tone="pink"
      name={weapon.name}
      label={weapon.name}
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      info={<InfoModal title={weapon.name} />}
      metadata={
        <div className={`${uiChipRow} items-center`}>
          <Chip colour="pink">Cybernetic</Chip>
          {weapon.class === "Melee" ? (
            <Chip colour="orange">Melee</Chip>
          ) : weapon.class ? (
            (() => {
              const c = weaponClassChip(weapon.class);
              return c ? <Chip colour={c.colour}>{c.label}</Chip> : null;
            })()
          ) : null}
        </div>
      }
    >
      {() => (
        <>
          <div className={`${uiChipRow}`}>
            {weapon.type === "ranged" && weapon.range && (
              <StatChip label="Range" value={weapon.range} />
            )}
            {weapon.type === "ranged" && weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
            {effectiveDamage && (
              <StatChip label="Damage" value={effectiveDamage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {effectiveDamage && <DamageTypeChip damage={effectiveDamage} />}
            {weapon.pen && <StatChip label="Pen" value={weapon.pen} />}
            {weapon.type === "ranged" && weapon.clip && (
              <StatChip label="Clip" value={weapon.clip} />
            )}
            {weapon.type === "ranged" && weapon.rld && (
              <StatChip label="Reload" value={weapon.rld} />
            )}
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

          <div className={uiStackField}>
            <EntryLines
              lines={{
                craftsmanship: {
                  value: craftsmanship,
                  info: (
                    <InfoModal
                      title={`${craftsmanship} Weapon`}
                      content={
                        weapon.type === "ranged"
                          ? rangedCraftsmanshipDescription(craftsmanship)
                          : meleeCraftsmanshipDescription(craftsmanship)
                      }
                    />
                  ),
                },
                qualities: {
                  value: hasRules ? effectiveSpecialRules : undefined,
                  info:
                    ruleNamesInLookup.length > 0 ? (
                      <InfoModal
                        title={`${weapon.name} Qualities`}
                        content={<SpecialRulesContent rules={effectiveSpecialRules ?? ""} />}
                      />
                    ) : undefined,
                },
                rules: {
                  info: rules ? (
                    <InfoModal
                      title={`${weapon.name} Rules`}
                      content={<InfoParagraph>{rules}</InfoParagraph>}
                    />
                  ) : undefined,
                },
                gainedFrom: cyberneticName,
              }}
            />
          </div>
        </>
      )}
    </AccordionCard>
  );
}
