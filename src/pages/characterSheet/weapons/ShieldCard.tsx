// src/pages/characterSheet/weapons/ShieldCard.tsx
// See ShieldPicker.tsx and CustomShieldForm.tsx for the picker and custom-item form.

import { useState, useEffect } from "react";
import type { ShieldItem } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";
import {
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiInfoModalWrapper,
  uiCardTitle,
} from "../../../ui/editableStyles";
import { uiExpandButton, uiIconRemoveButton } from "../../../ui/buttonStyles";
import { Chip } from "../../../ui/Chip";
import { colourLime } from "../../../ui/colourTokens";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { TrashIcon } from "../../../ui/TrashIcon";
import { ExpandChevron } from "../../../ui/ExpandChevron";

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
  libraryItem?: CampaignCustomItem<"armour">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onRemove: () => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      {/* Header — always visible */}
      <button type="button"
        className="w-full flex items-stretch justify-between gap-2 p-3 lg:p-4"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={uiExpandButton}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={uiCardTitle}>{item.name}</p>
            {libraryItem && (
              <StatusBadge status={libraryItem.status} />
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={colourLime}>Shield</Chip>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
      </button>

      {expanded && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-3">
          {editable && (
            <div className="flex justify-end">
              <button type="button" onClick={onRemove} aria-label="Remove" className={uiIconRemoveButton}>
                <TrashIcon className="w-4 h-4" />
              </button>
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
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
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
                    content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.notes}</p>}
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
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </div>
      )}
    </div>
  );
}
