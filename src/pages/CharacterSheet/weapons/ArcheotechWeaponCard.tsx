// src/pages/CharacterSheet/weapons/ArcheotechWeaponCard.tsx
// Collapsible card for weapons, grenades and mines stored in the Archeotech tab.

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiCardTitle,
  uiInfoModalWrapper,
} from "../../../ui/styles/editableStyles";
import { uiExpandButton } from "../../../ui/styles/buttonStyles";
import { colourArcheotech, colourOrange } from "../../../ui/styles/colourTokens";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { computeMeleeTotalDamage } from "./weaponDamageFormatting";
import { weaponClassChip } from "./weaponHelpers";
import { ExplosiveMishapsContent } from "./ExplosiveMishapsContent";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";

export function ArcheotechWeaponCard({
  item,
  strengthBonus,
  editable = false,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  highlightAsArcheotech = true,
}: {
  item: ArcheotechItem;
  strengthBonus?: number;
  editable?: boolean;
  onRemove?: () => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  highlightAsArcheotech?: boolean;
} & CustomItemLibraryActionProps<"archeotech">) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const specialRules = item.specialRules ?? ref?.specialRules;
  const description = item.description ?? ref?.description;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;
  const source = item.source ?? ref?.source;
  const weaponClass = item.weaponClass ?? ref?.weaponClass;
  const damage = item.damage ?? ref?.damage;
  const range = item.range ?? ref?.range;
  const rof = item.rof ?? ref?.rof;
  const pen = item.pen ?? ref?.pen;
  const clip = item.clip ?? ref?.clip;
  const rld = item.rld ?? ref?.rld;

  const hasRules = !!specialRules?.trim();
  const ruleNamesInLookup = (specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const hasWeaponStats = !!(damage || weaponClass);
  const showMishaps = item.type === "Grenade";

  const containerClass = highlightAsArcheotech
    ? "border border-amber-500/60 bg-amber-900/10 rounded-lg overflow-hidden"
    : `${uiSectionShell} overflow-hidden`;

  return (
    <div className={containerClass}>
      {/* Header — always visible */}
      <div className="relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          className="absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={uiCardTitle}>{item.name}</p>
          </div>
          {(highlightAsArcheotech || weaponClass) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {highlightAsArcheotech && (
                <Chip size="sm" className={`${colourArcheotech} shrink-0`}>
                  Archeotech
                </Chip>
              )}
              {weaponClass === "Melee" ? (
                <Chip size="sm" className={colourOrange}>
                  Melee
                </Chip>
              ) : weaponClass ? (
                (() => {
                  const c = weaponClassChip(weaponClass);
                  return c ? (
                    <Chip size="sm" className={c.active}>
                      {c.label}
                    </Chip>
                  ) : null;
                })()
              ) : null}
            </div>
          )}
        </div>
        <div className="relative pointer-events-none flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          <ExpandChevron expanded={expanded} />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-3">
          {editable && onRemove && (
            <div className="flex justify-end">
              <RemoveButton onClick={onRemove} label="Remove" />
            </div>
          )}

          {/* Stat chips — only for items with structured weapon data */}
          {hasWeaponStats && (
            <div className="flex flex-wrap gap-1.5">
              {range && <StatChip label="Range" value={range} />}
              {rof && <StatChip label="RoF" value={rof} />}
              {damage && (
                <StatChip label="Damage" value={damage.replace(/\s*[IREX]$/i, "").trim()} />
              )}
              {damage && <DamageTypeChip damage={damage} />}
              {pen && <StatChip label="Pen" value={pen} />}
              {clip && <StatChip label="Clip" value={clip} />}
              {rld && <StatChip label="Reload" value={rld} />}
              {weaponClass === "Melee" && strengthBonus !== undefined && (
                <>
                  <StatChip label="SB" value={`+${strengthBonus}`} />
                  {damage && (
                    <StatChip
                      label="Total"
                      value={computeMeleeTotalDamage(damage, strengthBonus)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                {hasRules ? specialRules : "-"}
              </span>
              {ruleNamesInLookup.length > 0 && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {description ? (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                        {description}
                      </p>
                    }
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            {showMishaps && (
              <div className="flex items-center gap-1.5">
                <span className={uiTextLabel}>Mishaps</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title="Explosive Mishaps" content={<ExplosiveMishapsContent />} />
                </span>
              </div>
            )}
          </div>

          {libraryItem && (
            <CustomItemActionButtons
              libraryItem={libraryItem}
              isDM={isDM}
              canEditDefinition={canEditDefinition}
              busyAction={busyAction}
              onEditDefinition={onEditDefinition}
              onPublish={onPublish}
              onArchive={onArchive}
              onUpdateAllCopies={onUpdateAllCopies}
            />
          )}

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={weight}
            value={value}
            availability={availability}
            source={source}
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </div>
      )}
    </div>
  );
}
