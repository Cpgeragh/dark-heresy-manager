// src/pages/characterSheet/weapons/ArcheotechShieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiActionButtonCompact, uiTextMuted } from "../../../ui/editableStyles";
import { EquipToggle } from "./weaponShared";
import { locationLabel } from "../ArmourTab/armourHelpers";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  isEquipped: boolean;
  onToggleEquip: () => void;
  slotsDisabled?: boolean;
  onRemove: () => void;
}

export function ArcheotechShieldRow({
  item,
  editable,
  isEquipped,
  onToggleEquip,
  slotsDisabled = false,
  onRemove,
}: Props) {
  const locations = item.locations ?? [];

  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</span>
          <Chip
            size="sm"
            className="border-amber-700/50 bg-amber-500/10 text-amber-400 uppercase tracking-wide shrink-0"
          >
            Archeotech
          </Chip>
        </div>
        <p className={`text-xs lg:text-sm ${uiTextMuted}`}>
          Shield{locations.length > 0 ? ` · ${locationLabel(locations)}` : ""}
        </p>
        {item.ap !== undefined && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
              <span className="text-[10px] lg:text-xs text-cyan-500 uppercase tracking-wide">AP</span>
              <span className="text-sm lg:text-base font-code text-cyan-300 mt-0.5">{item.ap}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <EquipToggle
          equipped={isEquipped}
          disabled={slotsDisabled}
          editable={editable}
          onChange={onToggleEquip}
        />
        {editable && (
          <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
