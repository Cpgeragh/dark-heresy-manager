// src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { Button } from "../../../ui/buttons/Button";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
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
        item.description ? (
          <InfoModal title={`${item.name} Rules`} content={item.description} />
        ) : undefined
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
      actions={
        editable ? (
          <>
            {onToggleEquip && (
              <Button variant="neutral" size="sm" onClick={onToggleEquip}>
                {isEquipped ? "Stow" : "Wear"}
              </Button>
            )}
            <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
          </>
        ) : undefined
      }
    />
  );
}
