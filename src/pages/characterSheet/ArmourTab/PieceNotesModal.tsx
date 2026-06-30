// src/pages/characterSheet/ArmourTab/PieceNotesModal.tsx

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { WornArmourPiece } from "../../../types/Character";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { uiTextBody, uiTextPlaceholder, uiCardTitle } from "../../../ui/editableStyles";

interface Props {
  piece: WornArmourPiece;
  onClose: () => void;
}

/** Notes/info modal for a piece */
export function PieceNotesModal({ piece, onClose }: Props) {
  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const notes = piece.notes || ref?.notes;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
        <h3 className={uiCardTitle}>{piece.name}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-lg lg:text-xl leading-none"
        >
          ×
        </button>
      </div>
      <div className="px-4 lg:px-5 py-3 lg:py-4 space-y-3">
        {notes ? (
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{notes}</p>
        ) : (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No special rules.</p>
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
    </dialog>,
    document.body
  );
}
