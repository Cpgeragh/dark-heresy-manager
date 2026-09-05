// src/pages/CharacterSheet/weapons/ArcheotechShieldRow.tsx

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiSectionShell, uiCardTitle } from "../../../ui/styles/editableStyles";
import { uiExpandButton } from "../../../ui/styles/buttonStyles";
import { colourArcheotech, colourLime } from "../../../ui/styles/colourTokens";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { EquipToggle } from "./weaponShared";
import { locationLabel } from "../../../utils/armourLocations";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";

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
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const locations = item.locations ?? [];

  const containerClass = highlightAsArcheotech
    ? "border border-amber-500/60 bg-amber-900/10 rounded-lg overflow-hidden"
    : `${uiSectionShell} overflow-hidden`;

  return (
    <div className={containerClass}>
      <div className="relative w-full flex items-stretch gap-2 p-3 lg:p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          className="absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={uiCardTitle}>{item.name}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {highlightAsArcheotech && (
              <Chip size="sm" className={`${colourArcheotech} shrink-0`}>
                Archeotech
              </Chip>
            )}
            <Chip size="sm" className={colourLime}>
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
        <div className="px-3 pb-3 lg:px-4 lg:pb-4">
          {editable && (
            <div className="flex justify-end mt-2">
              <RemoveButton onClick={onRemove} label="Remove" />
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {locations.length > 0 && (
              <StatChip size="sm" label="Location" value={locationLabel(locations)} />
            )}
            {item.ap !== undefined && <StatChip size="sm" label="AP" value={String(item.ap)} />}
          </div>
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            className="flex flex-wrap gap-1.5 mt-1"
          />
        </div>
      )}
    </div>
  );
}
