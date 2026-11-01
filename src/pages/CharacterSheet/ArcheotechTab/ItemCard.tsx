// src/pages/CharacterSheet/ArcheotechTab/ItemCard.tsx

import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { locationLabel } from "../../../utils/armourLocations";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { InfoParagraph } from "../../../ui/InfoSection";
import { entryNotesLine } from "../../../ui/entryNotesLine";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";

interface Props extends CustomItemLibraryActionProps<"archeotech"> {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void | Promise<boolean | void>;
}

export function ItemCard({
  item,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
}: Props) {
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;

  const description = item.description ?? ref?.description;
  const specialRules = ref?.specialRules;
  const rules = item.rules?.trim() || ref?.rules;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;
  const source = item.source ?? ref?.source;

  const typeBadge = item.type ? <Chip colour="slate">{item.type}</Chip> : undefined;

  const information = description ? <InfoParagraph>{description}</InfoParagraph> : undefined;

  const rulesInfo = rules ? (
    <InfoModal title={`${item.name} Rules`} content={<InfoParagraph>{rules}</InfoParagraph>} />
  ) : undefined;

  const chips = (
    <>
      {item.type === "Armour" && (
        <>
          {item.locations && item.locations.length > 0 && (
            <StatChip label="Location" value={locationLabel(item.locations)} />
          )}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && <Chip colour="sky">Stacks</Chip>}
        </>
      )}
      {item.type === "Force Field" && item.protectionRating !== undefined && (
        <StatChip label="PR" value={String(item.protectionRating)} />
      )}
      {item.type === "Shield" && (
        <>
          {item.locations && item.locations.length > 0 && (
            <StatChip label="Location" value={locationLabel(item.locations)} />
          )}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
        </>
      )}
      {item.type === "Cybernetic" && item.bodyLocation && item.bodyLocation.length > 0 && (
        <StatChip
          label="Location"
          value={item.bodyLocation.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
        />
      )}
      <ItemMetaChips
        bare
        weight={weight}
        value={value}
        availability={availability}
        source={source}
      />
    </>
  );

  const craftsmanship =
    item.type === "Cybernetic" && item.craftsmanship ? item.craftsmanship : undefined;

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      collapsible
      badge={typeBadge}
      information={information}
      chips={chips}
      lines={{
        craftsmanship: craftsmanship ? { value: craftsmanship } : undefined,
        qualities: specialRules ? { value: specialRules } : undefined,
        rules: { info: rulesInfo },
        notes: entryNotesLine(item.name, item.itemNotes ?? item.notes, {
          collection: "archeotech",
          id: item.id,
          notes: item.personalNotes,
          editable,
        }),
      }}
      library={{
        libraryItem,
        isDM,
        canEditDefinition,
        busyAction,
        onEditDefinition,
        onPublish,
        onArchive,
        onUpdateAllCopies,
      }}
      removal={{ kind: "Archeotech Item", onRemove }}
    />
  );
}
