// src/pages/characterSheet/DrugsTab/DrugInfoModal.tsx

import type { DrugItem } from "../../../types/Character";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { rarityColour } from "../../../ui/sourceStyles";

export function DrugInfoModal({
  item,
  onClose,
}: {
  item: DrugItem;
  onClose: () => void;
}) {
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Cost / Rarity / Duration */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            {(item.value ?? ref?.value) && (
              <span>
                ₮ <span className="text-amber-400/80 font-mono">{item.value ?? ref?.value}</span>
              </span>
            )}
            {(item.rarity ?? ref?.rarity) && (
              <span className={rarityColour(item.rarity ?? ref?.rarity)}>
                {item.rarity ?? ref?.rarity}
              </span>
            )}
            {ref?.duration && (
              <span>
                ⏱ <span className="text-slate-300">{ref.duration}</span>
              </span>
            )}
          </div>

          {/* Effect */}
          {ref?.effect && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Effect
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{ref.effect}</p>
            </div>
          )}

          {/* Side effects */}
          {ref?.sideEffect && (
            <div>
              <p className="text-xs font-semibold text-red-500/70 uppercase tracking-wide mb-1">
                Side Effects
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{ref.sideEffect}</p>
            </div>
          )}

          {/* General notes */}
          {ref?.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{ref.notes}</p>
            </div>
          )}

          {/* Player notes */}
          {item.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Player Notes
              </p>
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
