// src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow, uiTextLabel } from "../../../ui/styles/editableStyles";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { CRAFTSMANSHIP_COLOUR } from "../../../ui/styles/craftsmanship";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechImplantRow({
  item,
  editable,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const locations = item.bodyLocation ?? [];

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
      metadata={
        <>
          <div className={`${uiChipRow} items-center`}>
            {locations.length > 0 && (
              <StatChip
                label="Location"
                value={locations.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
              />
            )}
            {item.craftsmanship && (
              <>
                <span className={uiTextLabel}>Quality</span>
                <Chip colour={CRAFTSMANSHIP_COLOUR[item.craftsmanship]} className="shrink-0">
                  {item.craftsmanship}
                </Chip>
              </>
            )}
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
          <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
        ) : undefined
      }
    />
  );
}
