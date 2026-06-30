// src/pages/characterSheet/weapons/ArcheotechShieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiSection, uiCardTitle } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { colourArcheotech } from "../../../ui/colourTokens";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { EquipToggle, StatChip } from "./weaponShared";
import { locationLabel } from "../ArmourTab/armourHelpers";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  isEquipped: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  onRemove: () => void;
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
  const locations = item.locations ?? [];

  const containerClass = highlightAsArcheotech
    ? "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div className={`${containerClass} flex items-center gap-2`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={uiCardTitle}>{item.name}</span>
          {highlightAsArcheotech && (
            <Chip className={`${colourArcheotech} shrink-0`}>
              Archeotech
            </Chip>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
        </div>
        <ItemMetaChips
          weight={item.weight}
          value={item.value}
          availability={item.availability}
          className="flex flex-wrap gap-1.5 mt-1"
        />
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
        {editable && (
          <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
