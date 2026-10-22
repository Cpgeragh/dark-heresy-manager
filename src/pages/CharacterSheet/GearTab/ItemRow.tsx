// src/pages/CharacterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface Props extends CustomItemLibraryActionProps<"gear"> {
  item: GearItem;
  editable: boolean;
  onRemove: () => void | Promise<boolean | void>;
}

export function ItemRow({
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
  recordComponentRender("GearItemRow");
  const description = item.description?.trim();
  const rules = item.rules?.trim();

  // Fall back to reference data for items saved before weight/value/availability were stored
  const ref = item.referenceId ? GEAR_REFERENCE.find((r) => r.id === item.referenceId) : undefined;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      information={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
      chips={
        <ItemMetaChips
          bare
          weight={weight}
          value={value}
          availability={availability}
          source={item.source}
        />
      }
      lines={{
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
      removal={{ kind: "Gear Item", onRemove, hidden: Boolean(item.grantedByTalentEntryUid) }}
    />
  );
}
