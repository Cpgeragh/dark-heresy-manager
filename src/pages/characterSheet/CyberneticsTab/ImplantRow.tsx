// src/pages/characterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE, type CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { CRAFTSMANSHIP_STYLE, LOCATION_DISPLAY } from "./cyberneticsConstants";
import { craftsmanshipDescription } from "./cyberneticsHelpers";

interface Props {
  item: CyberneticItem;
  editable: boolean;
  onCycleQuality: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (item: CyberneticItem) => void;
}

export function ImplantRow({ item, editable, onCycleQuality, onRemove, onInfo }: Props) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className={[sectionContainerClass(editable), "flex items-center gap-3"].join(" ")}>
      {/* Name + craftsmanship description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{item.name}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
          {craftsmanshipDescription(ref ?? {} as CyberneticRef, item.craftsmanship)}
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
      </div>

      {/* Info button */}
      <button
        onClick={() => onInfo(item)}
        title="View rules"
        className="text-slate-500 hover:text-slate-300 text-sm px-1 transition shrink-0"
      >
        ⓘ
      </button>

      {/* Craftsmanship badge — clickable when editable */}
      <button
        onClick={() => editable && onCycleQuality(item.id)}
        title={editable ? `Click to change craftsmanship (currently ${item.craftsmanship})` : item.craftsmanship}
        disabled={!editable}
        className={[
          "text-xs px-2 py-1 rounded border font-medium transition shrink-0",
          CRAFTSMANSHIP_STYLE[item.craftsmanship],
          editable ? "cursor-pointer hover:opacity-80" : "cursor-default",
        ].join(" ")}
      >
        {item.craftsmanship}
      </button>

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
