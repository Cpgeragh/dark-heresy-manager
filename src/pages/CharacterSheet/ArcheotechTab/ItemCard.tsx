// src/pages/CharacterSheet/ArcheotechTab/ItemCard.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import {
  uiSection,
  uiTextBody,
  uiTextLabel,
  uiItemName,
  uiInfoModalWrapper,
} from "../../../ui/styles/editableStyles";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { CRAFTSMANSHIP_COLOUR } from "../../../ui/styles/craftsmanship";
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

  const hasBody = !!(item.description?.trim() || item.notes?.trim());
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;

  const description = item.description ?? ref?.description;
  const specialRules = ref?.specialRules;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;
  const source = item.source ?? ref?.source;

  const titleContent = (
    <>
      <span className={uiItemName}>{item.name}</span>
      {libraryItem && <StatusBadge status={libraryItem.status} />}
      {item.type && <Chip colour="slate">{item.type}</Chip>}
    </>
  );

  const details = (
    <>
      {editable && hasBody && (
        <div className="flex justify-end">
          <RemoveButton onClick={onRemove} label="Remove" />
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="space-y-1.5">
          {specialRules && (
            <p className={`text-xs lg:text-sm ${uiTextBody}`}>
              <span className={`${uiTextLabel} mr-1`}>Special</span>
              {specialRules}
            </p>
          )}
          {description && (
            <p className={`text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{description}</p>
          )}
          {item.notes?.trim() && (
            <p className="text-xs lg:text-sm text-amber-300/70 leading-relaxed">{item.notes}</p>
          )}
        </div>
      )}

      {/* Type-specific stat chips */}
      {item.type === "Armour" && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {item.locations && item.locations.length > 0 && (
            <StatChip label="Location" value={locationLabel(item.locations)} />
          )}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          {item.stacks && <Chip colour="sky">Stacks</Chip>}
        </div>
      )}
      {item.type === "Force Field" && item.protectionRating !== undefined && (
        <div className="mt-1">
          <StatChip label="PR" value={String(item.protectionRating)} />
        </div>
      )}
      {item.type === "Shield" && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {item.locations && item.locations.length > 0 && (
            <StatChip label="Location" value={locationLabel(item.locations)} />
          )}
          {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
        </div>
      )}
      {item.type === "Cybernetic" && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <StatChip
              label="Location"
              value={item.bodyLocation
                .map((location) => ARMOUR_LOCATION_LABELS[location])
                .join(" & ")}
            />
          )}
          {item.craftsmanship && (
            <>
              <span className={uiTextLabel}>Quality</span>
              <Chip colour={CRAFTSMANSHIP_COLOUR[item.craftsmanship]} className="shrink-0">
                {item.craftsmanship}
              </Chip>
            </>
          )}
        </div>
      )}

      {/* Chips */}
      <ItemMetaChips
        weight={weight}
        value={value}
        availability={availability}
        source={source}
        className="flex flex-wrap gap-1.5 mt-1.5"
      />
      {libraryItem && (
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
      )}
    </>
  );

  if (hasBody) {
    return (
      <AccordionCard
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        header={<div className="flex flex-wrap items-center gap-2">{titleContent}</div>}
      >
        <div className="px-3 pb-3 lg:px-4 lg:pb-4">{details}</div>
      </AccordionCard>
    );
  }

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {titleContent}
            {description && (
              <span className={uiInfoModalWrapper}>
                <InfoModal title={item.name} content={description} />
              </span>
            )}
          </div>
          <div>{details}</div>
        </div>

        {editable && <RemoveButton onClick={onRemove} label="Remove" className="mt-0.5" />}
      </div>
    </div>
  );
}
