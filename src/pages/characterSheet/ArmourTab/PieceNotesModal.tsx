// src/pages/characterSheet/ArmourTab/PieceNotesModal.tsx

import type { ArmourLocationKey, WornArmourPiece } from "../../../types/Character";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { LOCATION_LABELS, locationLabel } from "./armourHelpers";

interface Props {
  piece: WornArmourPiece;
  onClose: () => void;
}

/** Notes/info modal for a piece */
export function PieceNotesModal({ piece, onClose }: Props) {
  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const notes = piece.notes || ref?.notes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <h3 className="text-sm lg:text-base font-semibold text-slate-200">{piece.name}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg lg:text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-4 lg:px-5 py-3 lg:py-4 space-y-3">
          <div className="flex flex-wrap gap-4 text-xs lg:text-sm text-slate-400">
            <span>
              AP: <span className="text-slate-200 font-code">{piece.ap}</span>
            </span>
            <span>
              Covers: <span className="text-slate-200">{locationLabel(piece.locations)}</span>
            </span>
            {piece.weight && (
              <span>
                ⚖ <span className="text-slate-200">{piece.weight}</span>
              </span>
            )}
            {piece.value && (
              <span>
                ₮ <span className="text-slate-200">{piece.value}</span>
              </span>
            )}
            {piece.rarity && <span className={rarityColour(piece.rarity)}>{piece.rarity}</span>}
          </div>
          {Object.keys(piece.apOverrides ?? {}).length > 0 && (
            <div className="text-xs lg:text-sm text-slate-400">
              Overrides:{" "}
              {Object.entries(piece.apOverrides!).map(([loc, ap]) => (
                <span key={loc} className="mr-2">
                  {LOCATION_LABELS[loc as ArmourLocationKey]}:{" "}
                  <span className="text-slate-200">{ap}</span>
                </span>
              ))}
            </div>
          )}
          {notes ? (
            <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{notes}</p>
          ) : (
            <p className="text-sm lg:text-base text-slate-500 italic">No special rules.</p>
          )}
        </div>
        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
