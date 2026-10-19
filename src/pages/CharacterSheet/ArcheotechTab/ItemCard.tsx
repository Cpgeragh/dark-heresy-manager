// src/pages/CharacterSheet/ArcheotechTab/ItemCard.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import {
  uiChipRow,
  uiOverlayItemNameHover,
  uiSectionShell,
  uiStackSection,
} from "../../../ui/styles/editableStyles";
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
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { CharacterEntryRow, CharacterEntryRowContent } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";

interface Props extends CustomItemLibraryActionProps<"archeotech"> {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void | Promise<void>;
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

  const badge = (
    <>
      {libraryItem && <StatusBadge status={libraryItem.status} />}
      {item.type && <Chip colour="slate">{item.type}</Chip>}
    </>
  );

  const information = (
    <InfoModal
      title={item.name}
      content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
    />
  );

  const removeAction = editable ? (
    <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
  ) : undefined;

  const metadata = (
    <>
      {item.type === "Armour" && (
        <div className={uiChipRow}>
          {item.locations && item.locations.length > 0 && (
            <StatChip label="Location" value={locationLabel(item.locations)} />
          )}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && <Chip colour="sky">Stacks</Chip>}
        </div>
      )}
      {item.type === "Force Field" && item.protectionRating !== undefined && (
        <div className={uiChipRow}>
          <StatChip label="PR" value={String(item.protectionRating)} />
        </div>
      )}
      {item.type === "Shield" && (
        <div className={uiChipRow}>
          {item.locations && item.locations.length > 0 && (
            <StatChip label="Location" value={locationLabel(item.locations)} />
          )}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
        </div>
      )}
      {item.type === "Cybernetic" && item.bodyLocation && item.bodyLocation.length > 0 && (
        <div className={uiChipRow}>
          <StatChip
            label="Location"
            value={item.bodyLocation
              .map((location) => ARMOUR_LOCATION_LABELS[location])
              .join(" & ")}
          />
        </div>
      )}
      <ItemMetaChips
        weight={weight}
        value={value}
        availability={availability}
        source={source}
        className={uiChipRow}
      />
    </>
  );

  const lines = (
    <>
      {specialRules && <EntryDetailLine label="Qualities" value={specialRules} />}
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
      {item.type === "Cybernetic" && item.craftsmanship && (
        <EntryDetailLine label="Craftsmanship" value={item.craftsmanship} />
      )}
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
      <div className={`${uiSectionShell} overflow-hidden`}>
        <div className={`${uiCardTapHeader} relative w-full p-3 lg:p-4`}>
          <CardOverlayButton
            label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
            expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          />
          <CharacterEntryRowContent
            interactive
            name={item.name}
            nameClassName={uiOverlayItemNameHover}
            badge={badge}
            info={information}
            metadata={metadata}
            removeAction={removeAction}
            expandControl={<ExpandChevron expanded={expanded} />}
          />
        </div>
        {expanded && (
          <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${uiStackSection}`}>
            {lines}
            {libraryActions}
          </div>
        )}
      </div>
    );
  }

  return (
    <CharacterEntryRow
      name={item.name}
      badge={badge}
      info={information}
      metadata={metadata}
      afterMetadata={lines}
      removeAction={removeAction}
    >
      {libraryActions}
    </CharacterEntryRow>
  );
}
