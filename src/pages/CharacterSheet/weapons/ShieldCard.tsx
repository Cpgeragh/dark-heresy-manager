// src/pages/CharacterSheet/weapons/ShieldCard.tsx
// See ShieldPicker.tsx and CustomShieldForm.tsx for the picker and custom-item form.

import { useState } from "react";
import type { ShieldItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import {
  uiChipRow,
  uiTextBody,
  uiTextLabel,
  uiInfoModalWrapper,
  uiStackField,
} from "../../../ui/styles/editableStyles";
import { AccordionCard } from "../../../ui/AccordionCard";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
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
  onSelect,
}: {
  item: ShieldItem;
  editable: boolean;
  onRemove: () => unknown;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  onSelect?: () => void;
} & CustomItemLibraryActionProps<"armour">) {
  const [expanded, setExpanded] = useState(false);

  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const ruleNamesInLookup = getKnownSpecialRuleNames(item.specialRules);

  return (
    <AccordionCard
      name={item.name}
      label={item.name}
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      onSelect={onSelect}
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
    >
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
        <EntryDetailLine
          label="Rules"
          info={
            item.rules?.trim() ? (
              <InfoModal
                title={`${item.name} Rules`}
                content={<InfoParagraph>{item.rules.trim()}</InfoParagraph>}
              />
            ) : undefined
          }
        />
      </div>

      {/* Weight / Value / Availability / Source */}
      <ItemMetaChips
        weight={item.weight}
        value={item.value}
        availability={item.availability}
        source={item.source}
        className={`${uiChipRow} border-t ${colourDivider} pt-2 mt-1`}
      />
    </AccordionCard>
  );
}
