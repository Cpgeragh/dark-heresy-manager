// src/pages/characterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiSection, uiCardTitle, uiTextLabel, uiTextPlaceholder, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { uiIconRemoveButton } from "../../../ui/buttonStyles";
import { colourArcheotech, colourStacks } from "../../../ui/colourTokens";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";
import { InfoModal } from "../../../components/InfoModal";
import { locationLabel } from "./armourHelpers";
import { TrashIcon } from "../../../ui/TrashIcon";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechArmourRow({ item, editable, onToggleEquip, onRemove, highlightAsArcheotech = true }: Props) {
  const isEquipped = item.equipped ?? false;
  const locations = item.locations ?? [];

  const containerClass = highlightAsArcheotech
    ? "border border-amber-500/60 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div
      className={[
        containerClass,
        "flex items-start gap-3",
        !isEquipped ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={uiCardTitle}>{item.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && (
            <Chip className={colourStacks}>Stacks</Chip>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {highlightAsArcheotech && (
            <Chip className={`${colourArcheotech} shrink-0`}>
              Archeotech
            </Chip>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className={uiTextLabel}>Rules</span>
            {item.description ? (
              <span className={uiInfoModalWrapper}>
                <InfoModal title={`${item.name} Rules`} content={item.description} />
              </span>
            ) : (
              <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
            )}
          </div>
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
          />
        </div>
      </div>

      {editable && onToggleEquip && (
        <button type="button"
          onClick={onToggleEquip}
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {isEquipped ? "Stow" : "Wear"}
        </button>
      )}

      {editable && (
        <button type="button" onClick={onRemove} aria-label="Remove" className={uiIconRemoveButton}>
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
