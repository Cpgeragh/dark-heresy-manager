// src/pages/CharacterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { Chip } from "../../../ui/chips/Chip";
import {
  uiChipRow,
  uiTextLabel,
  uiInfoModalWrapper,
  uiTextDescription,
  uiStackBody,
} from "../../../ui/styles/editableStyles";
import { colourAmberPlain } from "../../../ui/styles/colourTokens";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { CRAFTSMANSHIP_COLOUR } from "../../../ui/styles/craftsmanship";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";
import { isVariableMeta } from "../../../data/reference/referenceMeta";
import {
  availableCraftsmanship,
  concealedWeaponBionicDescription,
  craftsmanshipDescription,
} from "./cyberneticsHelpers";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props extends CustomItemLibraryActionProps<"cybernetic"> {
  item: CyberneticItem;
  linkedArmName?: string;
  linkedWeaponName?: string;
  linkedWeaponType?: "ranged" | "melee";
  editable: boolean;
  onCycleQuality: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImplantRow({
  item,
  linkedArmName,
  linkedWeaponName,
  linkedWeaponType,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onCycleQuality,
  onRemove,
}: Props) {
  recordComponentRender("ImplantRow");
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);
  const qualityOptions = availableCraftsmanship(ref);
  const canChangeQuality = editable && qualityOptions.length > 1;
  const displayedCraftsmanship =
    item.craftsmanship && qualityOptions.includes(item.craftsmanship)
      ? item.craftsmanship
      : qualityOptions[0];
  const qualityDescription = ref
    ? ref.id === "ih-concealed-weapon-bionic"
      ? concealedWeaponBionicDescription(displayedCraftsmanship, linkedWeaponType)
      : craftsmanshipDescription(ref, displayedCraftsmanship)
    : (item.notes ?? "No rules recorded.");
  const isConcealedWeaponBionic = ref?.id === "ih-concealed-weapon-bionic";

  return (
    <CharacterEntryRow
      name={item.name}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      info={
        !isConcealedWeaponBionic && (ref?.notes || item.notes) ? (
          <InfoModal
            title={item.name}
            content={
              <div className={uiStackBody}>
                {ref?.notes && (
                  <div>
                    <p className={`${uiTextLabel} font-semibold mb-1`}>Item Rules</p>
                    <p className={uiTextDescription}>{ref.notes}</p>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
                    <p className={uiTextDescription}>{item.notes}</p>
                  </div>
                )}
              </div>
            }
          />
        ) : undefined
      }
      metadata={
        <div className={uiChipRow}>
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <Chip colour="slate">
              {item.bodyLocation.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
            </Chip>
          )}
          <ItemMetaChips
            bare
            value={item.value ?? (isVariableMeta(ref?.value) ? undefined : ref?.value)}
            availability={
              item.availability ??
              (isVariableMeta(ref?.availability) ? undefined : ref?.availability)
            }
            source={item.source ?? ref?.source}
          />
        </div>
      }
      afterMetadata={
        <>
          {item.grantedByTalentName && (
            <p className={`text-xs ${colourAmberPlain}`}>
              {item.grantedByTalentName} ({item.grantedByType}): Granted
            </p>
          )}
          {linkedArmName && linkedWeaponName && (
            <div className={`${uiChipRow} items-center`}>
              <span className={uiTextLabel}>Linked</span>
              <Chip colour="pink">{linkedArmName}</Chip>
              <Chip colour="pink">{linkedWeaponName}</Chip>
            </div>
          )}
          {item.craftsmanship && (
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Quality</span>
              <Chip
                as="button"
                type="button"
                onClick={() => canChangeQuality && onCycleQuality(item.id)}
                title={
                  canChangeQuality
                    ? `Click to change quality (currently ${displayedCraftsmanship})`
                    : displayedCraftsmanship
                }
                disabled={!canChangeQuality}
                colour={CRAFTSMANSHIP_COLOUR[displayedCraftsmanship]}
                className="shrink-0"
              >
                {displayedCraftsmanship}
              </Chip>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={`${displayedCraftsmanship} ${item.name}`}
                  content={
                    <p className={`whitespace-pre-line ${uiTextDescription}`}>
                      {qualityDescription}
                    </p>
                  }
                />
              </span>
            </div>
          )}
        </>
      }
      actions={
        editable && !item.grantedByTalentEntryUid ? (
          <RemoveEntryButton kind="Implant" name={item.name} onRemove={() => onRemove(item.id)} />
        ) : undefined
      }
    >
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
    </CharacterEntryRow>
  );
}
