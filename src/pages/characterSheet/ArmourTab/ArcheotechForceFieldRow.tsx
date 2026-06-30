// src/pages/characterSheet/ArmourTab/ArcheotechForceFieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiSection, uiCardTitle } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { colourArcheotech } from "../../../ui/colourTokens";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechForceFieldRow({ item, editable, onToggleEquip, onRemove, highlightAsArcheotech = true }: Props) {
  const active = item.equipped ?? false;

  const containerClass = highlightAsArcheotech
    ? "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div
      className={[
        containerClass,
        "flex items-center gap-3",
        !active ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={uiCardTitle}>{item.name}</span>
          {highlightAsArcheotech && (
            <Chip className={`${colourArcheotech} shrink-0`}>
              Archeotech
            </Chip>
          )}
        </div>
        {item.protectionRating !== undefined && (
          <div className="mt-1">
            <StatChip label="PR" value={String(item.protectionRating)} />
          </div>
        )}
        <ItemMetaChips
          weight={item.weight}
          value={item.value}
          availability={item.availability}
          className="flex flex-wrap gap-1.5 mt-1"
        />
      </div>

      {editable && onToggleEquip && (
        <button
          onClick={onToggleEquip}
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {active ? "Deactivate" : "Activate"}
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
