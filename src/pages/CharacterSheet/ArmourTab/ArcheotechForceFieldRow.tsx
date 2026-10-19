// src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";

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
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = ref?.rules;

  return (
    <CharacterEntryRow
      name={item.name}
      badge={
        highlightAsArcheotech ? (
          <Chip colour="amber" className="shrink-0">
            Archeotech
          </Chip>
        ) : undefined
      }
      tone={highlightAsArcheotech ? "archeotech" : "default"}
      inactive={!active}
      info={
        <InfoModal
          title={item.name}
          content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <>
          {item.protectionRating !== undefined && (
            <div className={uiChipRow}>
              <StatChip label="PR" value={String(item.protectionRating)} />
            </div>
          )}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            className={uiChipRow}
          />
        </>
      }
      afterMetadata={
        <EntryDetailLine
          label="Rules"
          info={
            rules ? (
              <InfoModal
                title={`${item.name} Rules`}
                content={<InfoParagraph>{rules}</InfoParagraph>}
              />
            ) : undefined
          }
        />
      }
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
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
        ) : undefined
      }
    />
  );
}
