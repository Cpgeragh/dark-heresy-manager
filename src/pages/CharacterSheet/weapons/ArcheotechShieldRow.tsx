// src/pages/CharacterSheet/weapons/ArcheotechShieldRow.tsx

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import {
  uiChipRow,
  uiInlineRow,
  uiNoticeBox,
  uiSectionShell,
  uiCardTitleHover,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader, uiExpandButton } from "../../../ui/styles/buttonStyles";
import { colourNoticeAmber } from "../../../ui/styles/colourTokens";
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
    ? `${uiNoticeBox} ${colourNoticeAmber} overflow-hidden`
    : `${uiSectionShell} overflow-hidden`;

  return (
    <div className={containerClass}>
      <div className={`${uiCardTapHeader} relative w-full flex items-stretch gap-2 p-3 lg:p-4`}>
        <CardOverlayButton
          label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className={`${uiInlineRow} flex-wrap`}>
            <span className={uiCardTitleHover}>{item.name}</span>
          </div>
          <div className={`mt-0.5 ${uiChipRow} items-center`}>
            {highlightAsArcheotech && (
              <Chip size="sm" colour="amber" className="shrink-0">
                Archeotech
              </Chip>
            )}
            <Chip size="sm" colour="lime">
              Shield
            </Chip>
          </div>
        </div>
        <div className={`relative pointer-events-none ${uiInlineRow} shrink-0`}>
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
          <div className={`mt-1 ${uiChipRow}`}>
            {locations.length > 0 && (
              <StatChip size="sm" label="Location" value={locationLabel(locations)} />
            )}
            {item.ap !== undefined && <StatChip size="sm" label="AP" value={String(item.ap)} />}
          </div>
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            className={`${uiChipRow} mt-1`}
          />
        </div>
      )}
    </div>
  );
}
