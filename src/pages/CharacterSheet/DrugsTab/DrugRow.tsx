// src/pages/CharacterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { InfoParagraph, InfoSection } from "../../../ui/InfoSection";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
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
  onRemove: (id: string) => void | Promise<boolean | void>;
} & CustomItemLibraryActionProps<"drug">) {
  recordComponentRender("DrugRow");
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);
  const hasDescription = !!(ref?.notes || item.notes);
  const rules = item.rules?.trim();
  const hasRules = !!(rules || ref?.effect || ref?.sideEffect);

  return (
    <OwnedEntryRow
      name={item.name}
      editable={editable}
      information={
        hasDescription ? (
          <>
            {ref?.notes && <InfoParagraph>{ref.notes}</InfoParagraph>}
            {item.notes &&
              (ref ? (
                <InfoSection heading="Player Notes">
                  <InfoParagraph>{item.notes}</InfoParagraph>
                </InfoSection>
              ) : (
                <InfoParagraph>{item.notes}</InfoParagraph>
              ))}
          </>
        ) : undefined
      }
      chips={
        <ItemMetaChips
          bare
          weight={item.weight ?? ref?.weight}
          value={item.value ?? ref?.value}
          availability={item.availability ?? ref?.availability}
          source={item.source}
        />
      }
      lines={{
        duration: ref?.duration ? { value: ref.duration } : undefined,
        rules: {
          info: hasRules ? (
            <InfoModal
              title={`${item.name} Rules`}
              content={
                <>
                  {rules && <InfoParagraph>{rules}</InfoParagraph>}
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
          ) : undefined,
        },
      }}
      actions={
        <QuantityControl
          quantity={item.quantity}
          editable={editable}
          onUpdate={(q) => onUpdateQty(item.id, q)}
        />
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
      removal={{ kind: "Drug", onRemove: () => onRemove(item.id) }}
    />
  );
}
