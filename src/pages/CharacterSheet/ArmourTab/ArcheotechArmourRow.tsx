// src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import {
  uiNoticeBox,
  uiSection,
  uiCardTitle,
  uiTextLabel,
  uiTextPlaceholder,
  uiInfoModalWrapper,
} from "../../../ui/styles/editableStyles";
import { Button } from "../../../ui/buttons/Button";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { colourNoticeAmber } from "../../../ui/styles/colourTokens";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { locationLabel } from "../../../utils/armourLocations";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechArmourRow({
  item,
  editable,
  onToggleEquip,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const isEquipped = item.equipped ?? false;
  const locations = item.locations ?? [];

  const containerClass = highlightAsArcheotech
    ? `${uiNoticeBox} ${colourNoticeAmber} p-3 lg:p-4`
    : uiSection;

  return (
    <div
      className={[containerClass, "flex items-start gap-3", !isEquipped ? "opacity-60" : ""].join(
        " "
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={uiCardTitle}>{item.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && <Chip colour="sky">Stacks</Chip>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {highlightAsArcheotech && (
            <Chip colour="amber" className="shrink-0">
              Archeotech
            </Chip>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className={uiTextLabel}>Rules</span>
            {item.description ? (
              <span className={uiInfoModalWrapper}>
                <InfoModal title={`${item.name} Rules`} content={item.description} />
              </span>
            ) : (
              <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
            )}
          </div>
          <ItemMetaChips weight={item.weight} value={item.value} availability={item.availability} />
        </div>
      </div>

      {editable && onToggleEquip && (
        <Button variant="neutral" size="sm" onClick={onToggleEquip}>
          {isEquipped ? "Stow" : "Wear"}
        </Button>
      )}

      {editable && <RemoveButton onClick={onRemove} label="Remove" />}
    </div>
  );
}
