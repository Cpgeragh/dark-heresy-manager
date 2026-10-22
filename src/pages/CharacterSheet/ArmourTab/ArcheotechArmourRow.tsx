// src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
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
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = item.rules?.trim() || ref?.rules;

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      badge={highlightAsArcheotech ? <Chip colour="amber">Archeotech</Chip> : undefined}
      tone={highlightAsArcheotech ? "archeotech" : "default"}
      inactive={!isEquipped}
      information={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
      chips={
        <>
          {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && <Chip colour="sky">Stacks</Chip>}
          <ItemMetaChips
            bare
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
          />
        </>
      }
      lines={{
        rules: {
          info: rules ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<InfoParagraph>{rules}</InfoParagraph>}
            />
          ) : undefined,
        },
      }}
      actions={
        onToggleEquip ? (
          <StateToggleButton
            active={isEquipped}
            activeLabel="Stow"
            inactiveLabel="Wear"
            activeBusyLabel="Stowing"
            inactiveBusyLabel="Wearing"
            statusLabel="Worn"
            disabled={false}
            editable={editable}
            onChange={onToggleEquip}
          />
        ) : undefined
      }
      removal={{ kind: "Archeotech Item", onRemove }}
    />
  );
}
