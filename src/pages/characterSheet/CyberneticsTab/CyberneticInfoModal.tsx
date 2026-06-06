// src/pages/characterSheet/CyberneticsTab/CyberneticInfoModal.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { CRAFTSMANSHIP_STYLE } from "./cyberneticsConstants";
import { availableCraftsmanship, craftsmanshipDescription } from "./cyberneticsHelpers";

interface Props {
  item: CyberneticItem;
  onClose: () => void;
}

export function CyberneticInfoModal({ item, onClose }: Props) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);
  const qualityOptions = availableCraftsmanship(ref);
  const displayedCraftsmanship = qualityOptions.includes(item.craftsmanship)
    ? item.craftsmanship
    : qualityOptions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CRAFTSMANSHIP_STYLE[displayedCraftsmanship]}`}>
              {displayedCraftsmanship}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Cost / rarity */}
          {ref && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span>₮ <span className="text-amber-400/80 font-mono">{ref.value}</span></span>
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            </div>
          )}

          {/* Craftsmanship rules */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {displayedCraftsmanship} Quality
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {ref ? craftsmanshipDescription(ref, displayedCraftsmanship) : item.notes ?? "No rules recorded."}
            </p>
          </div>

          {/* General notes */}
          {ref?.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">General Rules</p>
              <p className="text-sm text-slate-400 leading-relaxed">{ref.notes}</p>
            </div>
          )}

          {/* Player notes */}
          {item.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-400 leading-relaxed">{item.notes}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
