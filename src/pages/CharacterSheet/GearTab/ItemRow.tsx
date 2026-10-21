// src/pages/CharacterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
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
    <CharacterEntryRow
      name={item.name}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      info={
        <InfoModal
          title={item.name}
          content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <ItemMetaChips
          weight={weight}
          value={value}
          availability={availability}
          source={item.source}
          className={uiChipRow}
        />
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
          <RemoveEntryButton kind="Item" name={item.name} onRemove={onRemove} />
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
