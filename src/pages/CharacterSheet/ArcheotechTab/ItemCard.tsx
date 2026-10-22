// src/pages/CharacterSheet/ArcheotechTab/ItemCard.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { locationLabel } from "../../../utils/armourLocations";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { AccordionCard } from "../../../ui/AccordionCard";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
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
  const [expanded, setExpanded] = useState(false);

  const notes = item.notes?.trim();
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

  const badge = (
    <>
      {libraryItem && <StatusBadge status={libraryItem.status} />}
      {typeBadge}
    </>
  );

  const information = description ? <InfoParagraph>{description}</InfoParagraph> : undefined;

  const rulesInfo = rules ? (
    <InfoModal title={`${item.name} Rules`} content={<InfoParagraph>{rules}</InfoParagraph>} />
  ) : undefined;

  const removeAction = editable ? (
    <RemoveEntryButton kind="Archeotech Item" name={item.name} onRemove={onRemove} />
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

  const lines = (
    <>
      {craftsmanship && <EntryDetailLine label="Craftsmanship" value={craftsmanship} />}
      {specialRules && <EntryDetailLine label="Qualities" value={specialRules} />}
      <EntryDetailLine label="Rules" info={rulesInfo} />
      {notes && <EntryDetailLine label="Notes" value={notes} />}
    </>
  );

  const libraryActions = libraryItem ? (
    <CustomItemActionButtons
      libraryItem={libraryItem}
      isDM={isDM}
      canEditDefinition={canEditDefinition}
      busyAction={busyAction}
      onEditDefinition={onEditDefinition}
      onPublish={onPublish}
      onArchive={onArchive}
      onUpdateAllCopies={onUpdateAllCopies}
    />
  ) : undefined;

  if (notes) {
    return (
      <AccordionCard
        name={item.name}
        label={item.name}
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        badge={badge}
        info={<InfoModal title={item.name} content={information} />}
        metadata={<div className={`${uiChipRow} items-center`}>{chips}</div>}
        removeAction={removeAction}
      >
        {lines}
        {libraryActions}
      </AccordionCard>
    );
  }

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      badge={typeBadge}
      information={information}
      chips={chips}
      lines={{
        craftsmanship: craftsmanship ? { value: craftsmanship } : undefined,
        qualities: specialRules ? { value: specialRules } : undefined,
        rules: { info: rulesInfo },
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
