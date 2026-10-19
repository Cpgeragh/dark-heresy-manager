// src/pages/CharacterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { uiChipRow } from "../../../ui/styles/editableStyles";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph, InfoSection } from "../../../ui/InfoSection";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { recordComponentRender } from "../../../performance/performanceMetrics";

export function DrugRow({
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
  onUpdateQty,
  onRemove,
}: {
  item: DrugItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void | Promise<void>;
} & CustomItemLibraryActionProps<"drug">) {
  recordComponentRender("DrugRow");
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);
  const hasDescription = !!(ref?.notes || item.notes);
  const hasRules = !!(ref?.effect || ref?.sideEffect);

  return (
    <CharacterEntryRow
      name={item.name}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      info={
        <InfoModal
          title={item.name}
          content={
            hasDescription ? (
              <>
                {ref?.notes && <InfoParagraph>{ref.notes}</InfoParagraph>}
                {item.notes && (
                  <InfoSection heading="Player Notes">
                    <InfoParagraph>{item.notes}</InfoParagraph>
                  </InfoSection>
                )}
              </>
            ) : undefined
          }
        />
      }
      metadata={
        <ItemMetaChips
          weight={item.weight ?? ref?.weight ?? "0 kg"}
          value={item.value ?? ref?.value}
          availability={item.availability ?? ref?.availability}
          source={item.source}
          className={uiChipRow}
        />
      }
      afterMetadata={
        <>
          {ref?.duration && <EntryDetailLine label="Duration" value={ref.duration} />}
          <EntryDetailLine
            label="Rules"
            info={
              hasRules ? (
                <InfoModal
                  title={`${item.name} Rules`}
                  content={
                    <>
                      {ref?.effect && (
                        <InfoSection heading="Effect">
                          <InfoParagraph>{ref.effect}</InfoParagraph>
                        </InfoSection>
                      )}
                      {ref?.sideEffect && (
                        <InfoSection heading="Side Effects">
                          <InfoParagraph>{ref.sideEffect}</InfoParagraph>
                        </InfoSection>
                      )}
                    </>
                  }
                />
              ) : undefined
            }
          />
        </>
      }
      actions={
        <QuantityControl
          quantity={item.quantity}
          editable={editable}
          onUpdate={(q) => onUpdateQty(item.id, q)}
        />
      }
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Drug" name={item.name} onRemove={() => onRemove(item.id)} />
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
