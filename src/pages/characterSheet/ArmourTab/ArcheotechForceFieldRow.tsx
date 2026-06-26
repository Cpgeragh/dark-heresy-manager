// src/pages/characterSheet/ArmourTab/ArcheotechForceFieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiActionButtonCompact } from "../../../ui/editableStyles";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip: () => void;
  onRemove: () => void;
}

export function ArcheotechForceFieldRow({ item, editable, onToggleEquip, onRemove }: Props) {
  const active = item.equipped ?? false;

  return (
    <div
      className={[
        "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4",
        "flex items-center gap-3",
        !active ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</span>
          <Chip size="sm" className="border-amber-700/50 bg-amber-500/10 text-amber-400 uppercase tracking-wide shrink-0">
            Archeotech
          </Chip>
        </div>
        {item.protectionRating !== undefined && (
          <div className="mt-1">
            <Chip className="border-slate-700 bg-slate-800/40 font-code text-slate-200">
              PR {item.protectionRating}
            </Chip>
          </div>
        )}
      </div>

      {editable && (
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
