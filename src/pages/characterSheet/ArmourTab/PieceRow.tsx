// src/pages/characterSheet/ArmourTab/PieceRow.tsx

import type { WornArmourPiece } from "../../../types/Character";
import { uiSection, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { locationLabel } from "./armourHelpers";

interface Props {
  piece: WornArmourPiece;
  editable: boolean;
  worn: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (piece: WornArmourPiece) => void;
}

function armourCraftsmanshipInfo(craftsmanship: NonNullable<WornArmourPiece["craftsmanship"]>) {
  switch (craftsmanship) {
    case "Poor":
      return "Badly fitted, designed or damaged armour. Characters wearing Poor armour take a -10 penalty to all Agility Tests.";
    case "Good":
      return "Well constructed and better fitting armour. Against the first attack in any round, the armour increases its AP by 1.";
    case "Best":
      return "Finely wrought and perfectly fitted armour. Best armour weighs half the normal amount and increases its AP by 1.";
    case "Common":
    default:
      return "Common craftsmanship armour has no additional modifier.";
  }
}

export function PieceRow({ piece, editable, worn, onToggle, onRemove, onInfo }: Props) {
  const apDesc =
    Object.keys(piece.apOverrides ?? {}).length > 0 ? `AP ${piece.ap}*` : `AP ${piece.ap}`;
  const craftsmanship = piece.craftsmanship ?? "Common";

  return (
    <div className={[uiSection, "flex items-center gap-3", !worn ? "opacity-60" : ""].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm lg:text-base font-medium text-slate-200 truncate">{piece.name}</span>
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <button
              onClick={() => onInfo(piece)}
              title="View rules"
              className="inline-flex h-[13.5px] w-[18px] shrink-0 my-auto items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 leading-none hover:bg-slate-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-2.5 h-2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </button>
          </span>
        </div>
        <div className="mt-1 space-y-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 text-slate-300">
              {locationLabel(piece.locations)}
            </span>
            <span className="text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 font-code text-slate-200">
              {apDesc}
            </span>
          </div>
          <ItemMetaChips
            weight={piece.weight}
            value={piece.value}
            rarity={piece.rarity}
            source={piece.source}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Craftsmanship</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
          <InfoModal
            title={`${craftsmanship} Armour`}
            content={armourCraftsmanshipInfo(craftsmanship)}
          />
        </div>
      </div>

      {editable && (
        <button
          onClick={() => onToggle(piece.id)}
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {worn ? "Stow" : "Wear"}
        </button>
      )}

      {editable && (
        <button
          onClick={() => onRemove(piece.id)}
          className="text-xs lg:text-sm text-red-400 hover:text-red-300 transition"
        >
          Remove
        </button>
      )}
    </div>
  );
}
