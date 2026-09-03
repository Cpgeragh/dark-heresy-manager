// src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiSection, uiTextLabel, uiCardTitle } from "../../../ui/styles/editableStyles";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { colourArcheotech } from "../../../ui/styles/colourTokens";
import { CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechImplantRow({
  item,
  editable,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const locations = item.bodyLocation ?? [];

  const containerClass = highlightAsArcheotech
    ? "border border-amber-500/60 bg-amber-900/10 rounded-lg p-3 lg:p-4"
    : uiSection;

  return (
    <div className={`${containerClass} flex items-start gap-3`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={uiCardTitle}>{item.name}</span>
          {highlightAsArcheotech && (
            <Chip className={`${colourArcheotech} shrink-0`}>Archeotech</Chip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {locations.length > 0 && (
            <StatChip
              label="Location"
              value={locations.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
            />
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
        <RemoveButton onClick={onRemove} label="Remove" />
      )}
    </div>
  );
}
