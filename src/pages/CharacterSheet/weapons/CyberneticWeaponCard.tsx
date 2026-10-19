// src/pages/CharacterSheet/weapons/CyberneticWeaponCard.tsx
// Read-only card for weapons granted by cybernetic implants.

import { useState } from "react";
import type { CyberneticWeapon } from "../../../data/reference/cyberneticsReference";
import type { WeaponCraftsmanship } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/chips/Chip";
import {
  uiChipRow,
  uiNoticeBox,
  uiTextLabel,
  uiTextBody,
  uiOverlayItemNameHover,
  uiInfoModalWrapper,
  uiStackSection,
  uiStackField,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { colourNoticePink } from "../../../ui/styles/colourTokens";
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
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";
import { CharacterEntryRowContent } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
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
  const effectiveSpecialRules =
    weapon.type === "ranged"
      ? rangedRulesForCraftsmanship(weapon.specialRules ?? "", craftsmanship)
      : weapon.specialRules;
  const effectiveDamage =
    weapon.type === "melee" && weapon.damage
      ? meleeDamageForCraftsmanship(weapon.damage, craftsmanship)
      : weapon.damage;
  const hasRules = !!effectiveSpecialRules?.trim();
  const ruleNamesInLookup = getKnownSpecialRuleNames(effectiveSpecialRules);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`${uiNoticeBox} ${colourNoticePink} overflow-hidden`}>
      <div className={`${uiCardTapHeader} relative w-full p-3 lg:p-4`}>
        <CardOverlayButton
          label={`${expanded ? "Collapse" : "Expand"} ${weapon.name} details`}
          expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        />
        <CharacterEntryRowContent
          interactive
          name={weapon.name}
          nameClassName={uiOverlayItemNameHover}
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
          expandControl={<ExpandChevron expanded={expanded} />}
        />
      </div>

      {expanded && (
        <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${uiStackSection}`}>
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
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Gained From</span>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>{cyberneticName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>
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
            <EntryDetailLine
              label="Rules"
              info={
                rules ? (
                  <InfoModal
                    title={`${weapon.name} Rules`}
                    content={<InfoParagraph>{rules}</InfoParagraph>}
                  />
                ) : undefined
              }
            />
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Craftsmanship</span>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>{craftsmanship}</span>
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
        </div>
      )}
    </div>
  );
}
