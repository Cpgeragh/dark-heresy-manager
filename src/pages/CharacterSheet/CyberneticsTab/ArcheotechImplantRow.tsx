// src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
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
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = item.rules?.trim() || ref?.rules;

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
      info={
        <InfoModal
          title={item.name}
          content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <>
          {locations.length > 0 && (
            <div className={`${uiChipRow} items-center`}>
              <StatChip
                label="Location"
                value={locations.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
              />
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
        <>
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
          {item.craftsmanship && (
            <EntryDetailLine label="Craftsmanship" value={item.craftsmanship} />
          )}
        </>
      }
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
        ) : undefined
      }
    />
  );
}
