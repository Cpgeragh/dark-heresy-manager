// src/pages/CharacterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { Chip } from "../../../ui/chips/Chip";
import { uiChipRow, uiTextLabel, uiTextDescription } from "../../../ui/styles/editableStyles";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { InfoParagraph, InfoSection } from "../../../ui/InfoSection";
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
  const rules = isConcealedWeaponBionic ? undefined : item.rules?.trim() || ref?.notes;

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      information={
        item.notes ? (
          ref ? (
            <InfoSection heading="Player Notes">
              <InfoParagraph>{item.notes}</InfoParagraph>
            </InfoSection>
          ) : (
            <InfoParagraph>{item.notes}</InfoParagraph>
          )
        ) : undefined
      }
      chips={
        <>
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
        </>
      }
      lines={{
        craftsmanship: item.craftsmanship
          ? {
              value: displayedCraftsmanship,
              info: (
                <InfoModal
                  title={`${displayedCraftsmanship} ${item.name}`}
                  content={
                    <p className={`whitespace-pre-line ${uiTextDescription}`}>
                      {qualityDescription}
                    </p>
                  }
                />
              ),
            }
          : undefined,
        rules: {
          info: rules ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={<InfoParagraph>{rules}</InfoParagraph>}
            />
          ) : undefined,
        },
        gainedFrom: item.grantedByTalentName
          ? `${item.grantedByTalentName} (${item.grantedByType})`
          : undefined,
      }}
      body={
        linkedArmName && linkedWeaponName ? (
          <div className={`${uiChipRow} items-center`}>
            <span className={uiTextLabel}>Linked</span>
            <Chip colour="pink">{linkedArmName}</Chip>
            <Chip colour="pink">{linkedWeaponName}</Chip>
          </div>
        ) : undefined
      }
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
      removal={{
        kind: "Implant",
        onRemove: () => onRemove(item.id),
        hidden: Boolean(item.grantedByTalentEntryUid),
      }}
    />
  );
}
