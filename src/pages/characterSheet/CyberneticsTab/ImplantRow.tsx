// src/pages/characterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { uiSection, uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
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
    : (item.notes ?? "No rules recorded.");

  return (
    <div className={[uiSection, "flex items-start gap-3"].join(" ")}>
      {/* Name + craftsmanship description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm lg:text-base font-medium text-slate-200 truncate">{item.name}</p>
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <InfoModal
              title={item.name}
              content={
                <div className="space-y-3">
                  {ref?.notes && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Item Rules
                      </p>
                      <p className={`text-sm ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Notes
                      </p>
                      <p className={`text-sm ${uiTextBody} leading-relaxed`}>{item.notes}</p>
                    </div>
                  )}
                </div>
              }
            />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <span className={`text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 ${uiTextMuted}`}>
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
          <span className={uiTextLabel}>Quality</span>
          <button
            onClick={() => canChangeQuality && onCycleQuality(item.id)}
            title={
              canChangeQuality
                ? `Click to change quality (currently ${displayedCraftsmanship})`
                : displayedCraftsmanship
            }
            disabled={!canChangeQuality}
            className={[
              "text-xs lg:text-sm px-1.5 lg:px-2 py-0.5 rounded border font-medium transition shrink-0",
              CRAFTSMANSHIP_STYLE[displayedCraftsmanship],
              canChangeQuality ? "cursor-pointer hover:opacity-80" : "cursor-default",
            ].join(" ")}
          >
            {displayedCraftsmanship}
          </button>
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <InfoModal
              title={`${displayedCraftsmanship} ${item.name}`}
              content={qualityDescription}
            />
          </span>
        </div>
      </div>

      {/* Info button */}
      <button onClick={() => undefined} title="View rules" className="hidden">
        ⓘ
      </button>

      {/* Craftsmanship badge — clickable when editable */}
      {/* Remove */}
      {editable && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs lg:text-sm text-red-400 hover:text-red-300 transition shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  );
}
