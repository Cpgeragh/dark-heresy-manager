// src/pages/CharacterSheet/weapons/ShieldCard.tsx
// See ShieldPicker.tsx and CustomShieldForm.tsx for the picker and custom-item form.

import { useState, useEffect } from "react";
import type { ShieldItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import {
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiInfoModalWrapper,
  uiCardTitleHover,
  uiTextDescription,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader, uiExpandButton } from "../../../ui/styles/buttonStyles";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
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
      <div
        className={`${uiCardTapHeader} relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4`}
      >
        <CardOverlayButton
          label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={uiCardTitleHover}>{item.name}</p>
            {libraryItem && <StatusBadge status={libraryItem.status} />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" colour="lime">
              Shield
            </Chip>
          </div>
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
          {editable && (
            <div className="flex justify-end">
              <RemoveButton onClick={onRemove} label="Remove" />
            </div>
          )}

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
          <div className="flex flex-wrap gap-1.5">
            <StatChip label="AP" value={String(item.ap)} />
            {item.locations && <StatChip label="Location" value={item.locations} />}
            {item.damage && (
              <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {item.damage && <DamageTypeChip damage={item.damage} />}
            {item.pen && <StatChip label="Pen" value={item.pen} />}
          </div>

          {/* Qualities / Rules */}
          <div className="space-y-1">
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
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {item.notes ? (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={<p className={uiTextDescription}>{item.notes}</p>}
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
          </div>

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
            className={`flex flex-wrap gap-1.5 border-t ${colourDivider} pt-2 mt-1`}
          />
        </div>
      )}
    </div>
  );
}
