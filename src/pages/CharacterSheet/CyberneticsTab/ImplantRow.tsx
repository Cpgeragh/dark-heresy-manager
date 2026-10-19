// src/pages/CharacterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow, uiTextLabel, uiTextDescription } from "../../../ui/styles/editableStyles";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph, InfoSection } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
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
  onRemove,
}: Props) {
  recordComponentRender("ImplantRow");
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);
  const qualityOptions = availableCraftsmanship(ref);
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
  const rules = isConcealedWeaponBionic ? undefined : ref?.notes;

  return (
    <CharacterEntryRow
      name={item.name}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      info={
        <InfoModal
          title={item.name}
          content={
            item.notes ? (
              <InfoSection heading="Player Notes">
                <InfoParagraph>{item.notes}</InfoParagraph>
              </InfoSection>
            ) : undefined
          }
        />
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
            <EntryDetailLine
              label="Craftsmanship"
              value={displayedCraftsmanship}
              info={
                <InfoModal
                  title={`${displayedCraftsmanship} ${item.name}`}
                  content={
                    <p className={`whitespace-pre-line ${uiTextDescription}`}>
                      {qualityDescription}
                    </p>
                  }
                />
              }
            />
          )}
          {linkedArmName && linkedWeaponName && (
            <div className={`${uiChipRow} items-center`}>
              <span className={uiTextLabel}>Linked</span>
              <Chip colour="pink">{linkedArmName}</Chip>
              <Chip colour="pink">{linkedWeaponName}</Chip>
            </div>
          )}
          {item.grantedByTalentName && (
            <EntryDetailLine
              label="Gained from"
              value={`${item.grantedByTalentName} (${item.grantedByType})`}
            />
          )}
        </>
      }
      removeAction={
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
