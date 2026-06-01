// src/pages/characterSheet/ArmourTab/ForceFieldRow.tsx

import type { WornArmourPiece } from "../../../types/Character";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";

interface Props {
  piece: WornArmourPiece;
  editable: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (piece: WornArmourPiece) => void;
}

export function ForceFieldRow({ piece, editable, onToggle, onRemove, onInfo }: Props) {
  const active = piece.worn;
  return (
    <div
      className={[
        sectionContainerClass(editable),
        "flex items-center gap-3",
        !active ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-200 truncate block">{piece.name}</span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {piece.protectionRating !== undefined && (
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 font-mono text-slate-200">
              PR {piece.protectionRating}
            </span>
          )}
          <ItemMetaChips bare weight={piece.weight} value={piece.value} rarity={piece.rarity} source={piece.source} />
        </div>
      </div>

      <button
        onClick={() => onInfo(piece)}
        title="View rules"
        className="text-slate-500 hover:text-slate-300 text-sm px-1 transition"
      >
        ⓘ
      </button>

      {editable && (
        <button
          onClick={() => onToggle(piece.id)}
          className="text-xs px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {active ? "Deactivate" : "Activate"}
        </button>
      )}

      {editable && (
        <button
          onClick={() => onRemove(piece.id)}
          className="text-xs text-red-400 hover:text-red-300 transition"
        >
          Remove
        </button>
      )}
    </div>
  );
}
