// src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onToggleEquip?: () => void;
  onRemove: () => unknown;
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
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = item.rules?.trim() || ref?.rules;

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      badge={highlightAsArcheotech ? <Chip colour="amber">Archeotech</Chip> : undefined}
      tone={highlightAsArcheotech ? "archeotech" : "default"}
      inactive={!active}
      information={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
      chips={
        <>
          {item.protectionRating !== undefined && (
            <StatChip label="PR" value={String(item.protectionRating)} />
          )}
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
            active={active}
            activeLabel="Deactivate"
            inactiveLabel="Activate"
            activeBusyLabel="Deactivating"
            inactiveBusyLabel="Activating"
            statusLabel="Active"
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
