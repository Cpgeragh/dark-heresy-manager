// src/pages/characterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiActionButtonCompact } from "../../../ui/editableStyles";
import { locationLabel } from "./armourHelpers";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip: () => void;
  onRemove: () => void;
}

export function ArcheotechArmourRow({ item, editable, onToggleEquip, onRemove }: Props) {
  const isEquipped = item.equipped ?? false;
  const locations = item.locations ?? [];

  return (
    <div
      className={[
        "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4",
        "flex items-center gap-3",
        !isEquipped ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</span>
          <Chip size="sm" className="border-amber-700/50 bg-amber-500/10 text-amber-400 uppercase tracking-wide shrink-0">
            Archeotech
          </Chip>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {locations.length > 0 && (
            <Chip className="border-slate-700 bg-slate-800/40 text-slate-300">
              {locationLabel(locations)}
            </Chip>
          )}
          {item.ap !== undefined && (
            <span className="text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 font-code text-slate-200">
              AP {item.ap}
            </span>
          )}
          {item.stacks && (
            <Chip className="border-sky-700/50 bg-sky-500/10 text-sky-400">Stacks</Chip>
          )}
        </div>
      </div>

      {editable && (
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
