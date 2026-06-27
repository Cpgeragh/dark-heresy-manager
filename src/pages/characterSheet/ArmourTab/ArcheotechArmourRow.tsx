// src/pages/characterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiActionButtonCompact, uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";
import { locationLabel } from "./armourHelpers";

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
    ? "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div
      className={[
        containerClass,
        "flex items-center gap-3",
        !isEquipped ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && (
            <Chip className="border-sky-700/50 bg-sky-500/10 text-sky-400">Stacks</Chip>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {highlightAsArcheotech && (
            <Chip className="border-amber-700/50 bg-amber-500/10 text-amber-400 shrink-0">
              Archeotech
            </Chip>
          )}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
          />
        </div>
      </div>

      {editable && onToggleEquip && (
        <button
          onClick={onToggleEquip}
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {isEquipped ? "Stow" : "Wear"}
        </button>
      )}

      {editable && (
        <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
          Remove
        </button>
      )}
    </div>
  );
}
