// src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { Chip } from "../../../ui/chips/Chip";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { InfoParagraph } from "../../../ui/InfoSection";
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
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      badge={highlightAsArcheotech ? <Chip colour="amber">Archeotech</Chip> : undefined}
      tone={highlightAsArcheotech ? "archeotech" : "default"}
      information={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
      chips={
        <>
          {locations.length > 0 && (
            <StatChip
              label="Location"
              value={locations.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
            />
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
        craftsmanship: item.craftsmanship ? { value: item.craftsmanship } : undefined,
        rules: {
          info: rules ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<InfoParagraph>{rules}</InfoParagraph>}
            />
          ) : undefined,
        },
      }}
      removal={{ kind: "Archeotech Item", onRemove }}
    />
  );
}
