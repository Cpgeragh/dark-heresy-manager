// src/pages/CharacterSheet/weapons/ArcheotechShieldRow.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { AccordionCard } from "../../../ui/AccordionCard";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { EquipToggle } from "./weaponShared";
import { locationLabel } from "../../../utils/armourLocations";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  isEquipped: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  onRemove: () => unknown;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechShieldRow({
  item,
  editable,
  isEquipped,
  onToggleEquip,
  slotsDisabled = false,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const locations = item.locations ?? [];
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = item.rules?.trim() || ref?.rules;

  return (
    <AccordionCard
      tone={highlightAsArcheotech ? "amber" : "default"}
      name={item.name}
      label={item.name}
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      info={
        <InfoModal
          title={item.name}
          content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <div className={`${uiChipRow} items-center`}>
          {highlightAsArcheotech && (
            <Chip colour="amber" className="shrink-0">
              Archeotech
            </Chip>
          )}
          <Chip colour="lime">Shield</Chip>
        </div>
      }
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Archeotech Item" name={item.name} onRemove={onRemove} />
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
      <div className={uiChipRow}>
        {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
        {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
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
      <ItemMetaChips
        weight={item.weight}
        value={item.value}
        availability={item.availability}
        className={uiChipRow}
      />
    </AccordionCard>
  );
}
