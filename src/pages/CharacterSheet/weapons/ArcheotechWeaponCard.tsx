// src/pages/CharacterSheet/weapons/ArcheotechWeaponCard.tsx
// Collapsible card for weapons, grenades and mines stored in the Archeotech tab.

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  uiChipRow,
  uiNoticeBox,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiOverlayItemNameHover,
  uiInfoModalWrapper,
  uiStackSection,
  uiStackField,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { colourNoticeAmber, colourDivider } from "../../../ui/styles/colourTokens";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { computeMeleeTotalDamage, getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { weaponClassChip } from "./weaponHelpers";
import { ExplosiveMishapsContent } from "./ExplosiveMishapsContent";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { CharacterEntryRowContent } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
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
  onRemove?: () => void | Promise<void>;
  isEquipped?: boolean;
  onToggleEquip?: () => void | Promise<void>;
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
  const rules = ref?.rules;
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
  const ruleNamesInLookup = getKnownSpecialRuleNames(specialRules);

  const hasWeaponStats = !!(damage || weaponClass);
  const showMishaps = item.type === "Grenade";

  const containerClass = highlightAsArcheotech
    ? `${uiNoticeBox} ${colourNoticeAmber} overflow-hidden`
    : `${uiSectionShell} overflow-hidden`;

  return (
    <div className={containerClass}>
      {/* Header: always visible */}
      <div className={`${uiCardTapHeader} relative w-full p-3 lg:p-4`}>
        <CardOverlayButton
          label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        />
        <CharacterEntryRowContent
          interactive
          name={item.name}
          nameClassName={uiOverlayItemNameHover}
          info={
            <InfoModal
              title={item.name}
              content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
            />
          }
          metadata={
            highlightAsArcheotech || weaponClass ? (
              <div className={`${uiChipRow} items-center`}>
                {highlightAsArcheotech && (
                  <Chip colour="amber" className="shrink-0">
                    Archeotech
                  </Chip>
                )}
                {weaponClass === "Melee" ? (
                  <Chip colour="orange">Melee</Chip>
                ) : weaponClass ? (
                  (() => {
                    const c = weaponClassChip(weaponClass);
                    return c ? <Chip colour={c.colour}>{c.label}</Chip> : null;
                  })()
                ) : null}
              </div>
            ) : undefined
          }
          removeAction={
            editable && onRemove ? (
              <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
            ) : undefined
          }
          actions={
            onToggleEquip ? (
              <EquipToggle
                equipped={isEquipped}
                disabled={slotsDisabled}
                editable={editable}
                onChange={onToggleEquip}
              />
            ) : undefined
          }
          expandControl={<ExpandChevron expanded={expanded} />}
        />
      </div>

      {expanded && (
        <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${uiStackSection}`}>
          {/* Stat chips: only for items with structured weapon data */}
          {hasWeaponStats && (
            <div className={`${uiChipRow}`}>
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
          <div className={uiStackField}>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>
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
            <EntryDetailLine
              label="Rules"
              info={
                rules ? (
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={<InfoParagraph>{rules}</InfoParagraph>}
                  />
                ) : undefined
              }
            />
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
            className={`${uiChipRow} border-t ${colourDivider} pt-2 mt-1`}
          />
        </div>
      )}
    </div>
  );
}
