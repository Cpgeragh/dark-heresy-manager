// src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { Button } from "../../../ui/buttons/Button";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechForceFieldRow({
  item,
  editable,
  onToggleEquip,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const active = item.equipped ?? false;

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
      inactive={!active}
      info={
        item.description ? (
          <InfoModal title={`${item.name} Rules`} content={item.description} />
        ) : undefined
      }
      metadata={
        <>
          {item.protectionRating !== undefined && (
            <div className={uiChipRow}>
              <StatChip label="PR" value={String(item.protectionRating)} />
            </div>
          )}
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
                {active ? "Deactivate" : "Activate"}
              </Button>
            )}
            <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
          </>
        ) : undefined
      }
    />
  );
}
