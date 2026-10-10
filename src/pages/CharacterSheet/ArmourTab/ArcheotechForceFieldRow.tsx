// src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow.tsx

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

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechForceFieldRow({
  item,
  editable,
  onToggleEquip,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const active = item.equipped ?? false;

  const containerClass = highlightAsArcheotech
    ? `${uiNoticeBox} ${colourNoticeAmber} p-3 lg:p-4`
    : uiSection;

  return (
    <div
      className={[containerClass, "flex items-start gap-3", !active ? "opacity-60" : ""].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={uiCardTitle}>{item.name}</span>
          {highlightAsArcheotech && (
            <Chip colour="amber" className="shrink-0">
              Archeotech
            </Chip>
          )}
        </div>
        {item.protectionRating !== undefined && (
          <div className="mt-1">
            <StatChip label="PR" value={String(item.protectionRating)} />
          </div>
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
        <ItemMetaChips
          weight={item.weight}
          value={item.value}
          availability={item.availability}
          className="flex flex-wrap gap-1.5 mt-1"
        />
      </div>

      {editable && onToggleEquip && (
        <Button variant="neutral" size="sm" onClick={onToggleEquip}>
          {active ? "Deactivate" : "Activate"}
        </Button>
      )}

      {editable && <RemoveButton onClick={onRemove} label="Remove" />}
    </div>
  );
}
