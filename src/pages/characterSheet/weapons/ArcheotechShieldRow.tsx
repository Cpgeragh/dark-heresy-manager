// src/pages/characterSheet/weapons/ArcheotechShieldRow.tsx

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiSection, uiCardTitle } from "../../../ui/editableStyles";
import { uiActionButtonCompact, uiExpandButton } from "../../../ui/buttonStyles";
import { colourArcheotech, colourLime } from "../../../ui/colourTokens";
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
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const locations = item.locations ?? [];

  const containerClass = highlightAsArcheotech
    ? "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div className={`${containerClass} flex items-start gap-2`}>
      <button className={uiExpandButton} onClick={() => setExpanded((e) => !e)}>
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
        {expanded && (
          <>
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
      </button>
      <div className="flex items-center gap-2 shrink-0">
        {onToggleEquip && (
          <EquipToggle
            equipped={isEquipped}
            disabled={slotsDisabled}
            editable={editable}
            onChange={onToggleEquip}
          />
        )}
        {editable && expanded && (
          <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
            Remove
          </button>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-slate-400 hover:text-slate-200 transition"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
