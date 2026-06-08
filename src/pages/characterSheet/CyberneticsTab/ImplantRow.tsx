// src/pages/characterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { CRAFTSMANSHIP_STYLE, LOCATION_DISPLAY } from "./cyberneticsConstants";
import { availableCraftsmanship, craftsmanshipDescription } from "./cyberneticsHelpers";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: CyberneticItem;
  editable: boolean;
  onCycleQuality: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImplantRow({ item, editable, onCycleQuality, onRemove }: Props) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);
  const qualityOptions = availableCraftsmanship(ref);
  const canChangeQuality = editable && qualityOptions.length > 1;
  const displayedCraftsmanship = qualityOptions.includes(item.craftsmanship)
    ? item.craftsmanship
    : qualityOptions[0];
  const qualityDescription = ref
    ? craftsmanshipDescription(ref, displayedCraftsmanship)
    : item.notes ?? "No rules recorded.";

  return (
    <div className={[uiSection, "flex items-start gap-3"].join(" ")}>
      {/* Name + craftsmanship description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
          <InfoModal
            title={item.name}
            content={
              <div className="space-y-3">
                {ref?.notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Item Rules</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{ref.notes}</p>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.notes}</p>
                  </div>
                )}
              </div>
            }
          />
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
          {qualityDescription}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              {item.bodyLocation.map((l) => LOCATION_DISPLAY[l]).join(" & ")}
            </span>
          )}
          <ItemMetaChips
            bare
            valueAmber
            value={item.value ?? ref?.value}
            rarity={item.rarity ?? ref?.rarity}
            source={item.source ?? ref?.source}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Quality</span>
          <button
            onClick={() => canChangeQuality && onCycleQuality(item.id)}
            title={canChangeQuality ? `Click to change quality (currently ${displayedCraftsmanship})` : displayedCraftsmanship}
            disabled={!canChangeQuality}
            className={[
              "text-xs px-1.5 py-0.5 rounded border font-medium transition shrink-0",
              CRAFTSMANSHIP_STYLE[displayedCraftsmanship],
              canChangeQuality ? "cursor-pointer hover:opacity-80" : "cursor-default",
            ].join(" ")}
          >
            {displayedCraftsmanship}
          </button>
          <InfoModal
            title={`${displayedCraftsmanship} ${item.name}`}
            content={qualityDescription}
          />
        </div>
      </div>

      {/* Info button */}
      <button
        onClick={() => undefined}
        title="View rules"
        className="hidden"
      >
        ⓘ
      </button>

      {/* Craftsmanship badge — clickable when editable */}
      {/* Remove */}
      {editable && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  );
}
