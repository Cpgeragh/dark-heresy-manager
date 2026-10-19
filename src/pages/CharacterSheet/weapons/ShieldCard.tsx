// src/pages/CharacterSheet/weapons/ShieldCard.tsx
// See ShieldPicker.tsx and CustomShieldForm.tsx for the picker and custom-item form.

import { useState, useEffect } from "react";
import type { ShieldItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import {
  uiChipRow,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiInfoModalWrapper,
  uiOverlayItemNameHover,
  uiStackSection,
  uiStackField,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { CharacterEntryRowContent } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";
import { colourDivider } from "../../../ui/styles/colourTokens";

export function ShieldCard({
  item,
  editable,
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
}: {
  item: ShieldItem;
  editable: boolean;
  onRemove: () => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
} & CustomItemLibraryActionProps<"armour">) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const ruleNamesInLookup = getKnownSpecialRuleNames(item.specialRules);

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
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
          badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
          info={
            <InfoModal
              title={item.name}
              content={item.notes ? <InfoParagraph>{item.notes}</InfoParagraph> : undefined}
            />
          }
          metadata={
            <div className={`${uiChipRow} items-center`}>
              <Chip colour="lime">Shield</Chip>
            </div>
          }
          removeAction={
            editable ? (
              <RemoveEntryButton kind="Shield" name={item.name} onRemove={onRemove} />
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
          {libraryItem && (
            <CustomItemActionButtons
              className="flex flex-wrap gap-2"
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

          {/* Stats */}
          <div className={`${uiChipRow}`}>
            <StatChip label="AP" value={String(item.ap)} />
            {item.locations && <StatChip label="Location" value={item.locations} />}
            {item.damage && (
              <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {item.damage && <DamageTypeChip damage={item.damage} />}
            {item.pen && <StatChip label="Pen" value={item.pen} />}
          </div>

          {/* Qualities / Rules */}
          <div className={uiStackField}>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>
                {hasRules ? item.specialRules : "-"}
              </span>
              {ruleNamesInLookup.length > 0 && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <EntryDetailLine label="Rules" />
          </div>

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
            className={`${uiChipRow} border-t ${colourDivider} pt-2 mt-1`}
          />
        </div>
      )}
    </div>
  );
}
