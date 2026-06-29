// src/pages/characterSheet/CyberneticsTab/ArcheotechImplantRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/Chip";
import { uiSection, uiTextLabel } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { colourArcheotech } from "../../../ui/colourTokens";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";
import { CRAFTSMANSHIP_STYLE, LOCATION_DISPLAY } from "./cyberneticsConstants";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechImplantRow({ item, editable, onRemove, highlightAsArcheotech = true }: Props) {
  const locations = item.bodyLocation ?? [];

  const containerClass = highlightAsArcheotech
    ? "border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div className={`${containerClass} flex items-start gap-3`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</span>
          {highlightAsArcheotech && (
            <Chip className={`${colourArcheotech} shrink-0`}>
              Archeotech
            </Chip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {locations.length > 0 && (
            <StatChip label="Location" value={locations.map((l) => LOCATION_DISPLAY[l] ?? l).join(" & ")} />
          )}
          {item.craftsmanship && (
            <>
              <span className={uiTextLabel}>Quality</span>
              <Chip className={`${CRAFTSMANSHIP_STYLE[item.craftsmanship]} shrink-0`}>
                {item.craftsmanship}
              </Chip>
            </>
          )}
        </div>
        <ItemMetaChips
          weight={item.weight}
          value={item.value}
          availability={item.availability}
          className="flex flex-wrap gap-1.5 mt-1"
        />
      </div>

      {editable && (
        <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
          Remove
        </button>
      )}
    </div>
  );
}
