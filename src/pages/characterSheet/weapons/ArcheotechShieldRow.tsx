// src/pages/characterSheet/weapons/ArcheotechShieldRow.tsx

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiSection, uiCardTitle } from "../../../ui/editableStyles";
import { uiExpandButton, uiIconRemoveButton } from "../../../ui/buttonStyles";
import { colourArcheotech, colourLime } from "../../../ui/colourTokens";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { EquipToggle, StatChip } from "./weaponShared";
import { locationLabel } from "../ArmourTab/armourHelpers";
import { TrashIcon } from "../../../ui/TrashIcon";
import { ExpandChevron } from "../../../ui/ExpandChevron";

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
    ? "border border-amber-500/60 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div className={containerClass}>
      <button
        className="w-full flex items-stretch gap-2"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={uiExpandButton}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={uiCardTitle}>{item.name}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {highlightAsArcheotech && (
              <Chip size="sm" className={`${colourArcheotech} shrink-0`}>
                Archeotech
              </Chip>
            )}
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
        <>
          {editable && (
            <div className="flex justify-end mt-2">
              <button onClick={onRemove} aria-label="Remove" className={uiIconRemoveButton}>
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {locations.length > 0 && <StatChip size="sm" label="Location" value={locationLabel(locations)} />}
            {item.ap !== undefined && <StatChip size="sm" label="AP" value={String(item.ap)} />}
          </div>
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            className="flex flex-wrap gap-1.5 mt-1"
          />
        </>
      )}
    </div>
  );
}
