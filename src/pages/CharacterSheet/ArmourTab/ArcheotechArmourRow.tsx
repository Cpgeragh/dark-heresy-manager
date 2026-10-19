// src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { locationLabel } from "../../../utils/armourLocations";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechArmourRow({
  item,
  editable,
  onToggleEquip,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const isEquipped = item.equipped ?? false;
  const locations = item.locations ?? [];
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = item.rules?.trim() || ref?.rules;

  return (
    <CharacterEntryRow
      name={item.name}
      badge={
        highlightAsArcheotech ? (
          <Chip colour="amber" className="shrink-0">
            Archeotech
          </Chip>
        ) : undefined
      }
      tone={highlightAsArcheotech ? "archeotech" : "default"}
      inactive={!isEquipped}
      info={
        <InfoModal
          title={item.name}
          content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <>
          <div className={uiChipRow}>
            {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
            {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
            {item.stacks && <Chip colour="sky">Stacks</Chip>}
          </div>
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            className={uiChipRow}
          />
        </>
      }
      afterMetadata={
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
      }
      actions={
        onToggleEquip ? (
          <StateToggleButton
            active={isEquipped}
            activeLabel="Stow"
            inactiveLabel="Wear"
            activeBusyLabel="Stowing"
            inactiveBusyLabel="Wearing"
            statusLabel="Worn"
            disabled={false}
            editable={editable}
            onChange={onToggleEquip}
          />
        ) : undefined
      }
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
        ) : undefined
      }
    />
  );
}
