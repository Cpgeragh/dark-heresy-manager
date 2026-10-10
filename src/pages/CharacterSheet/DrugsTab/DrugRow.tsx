// src/pages/CharacterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import {
  uiChipRow,
  uiInlineRow,
  uiSection,
  uiTextBody,
  uiTextLabel,
  uiItemName,
  uiInfoModalWrapper,
  uiTextDescription,
} from "../../../ui/styles/editableStyles";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { colourHeadingAccent } from "../../../ui/styles/colourTokens";

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
  const hasInfo = !!(ref?.effect || ref?.sideEffect || ref?.notes || item.notes);

  return (
    <div className={[uiSection, "flex items-start gap-3"].join(" ")}>
      {/* Name + duration + chips */}
      <div className="flex-1 min-w-0">
        <div className={`${uiInlineRow}`}>
          <p className={uiItemName}>{item.name}</p>
          {libraryItem && <StatusBadge status={libraryItem.status} />}
          {hasInfo && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={item.name}
                content={
                  <>
                    {ref?.duration && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Duration</p>
                        <p className={uiTextDescription}>{ref.duration}</p>
                      </div>
                    )}
                    {ref?.effect && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Effect</p>
                        <p className={uiTextDescription}>{ref.effect}</p>
                      </div>
                    )}
                    {ref?.sideEffect && (
                      <div>
                        <p
                          className={`text-xs lg:text-sm font-semibold ${colourHeadingAccent} uppercase tracking-wide mb-1`}
                        >
                          Side Effects
                        </p>
                        <p className={uiTextDescription}>{ref.sideEffect}</p>
                      </div>
                    )}
                    {ref?.notes && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
                        <p className={uiTextDescription}>{ref.notes}</p>
                      </div>
                    )}
                    {item.notes && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Player Notes</p>
                        <p className={uiTextDescription}>{item.notes}</p>
                      </div>
                    )}
                  </>
                }
              />
            </span>
          )}
        </div>
        {ref?.duration && (
          <p className={`text-xs lg:text-sm ${uiTextBody} mt-0.5`}>Duration: {ref.duration}</p>
        )}
        <ItemMetaChips
          weight={item.weight ?? ref?.weight ?? "0 kg"}
          value={item.value ?? ref?.value}
          availability={item.availability ?? ref?.availability}
          source={item.source}
          className={`${uiChipRow} mt-1`}
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
      </div>

      {/* Quantity controls */}
      <QuantityControl
        quantity={item.quantity}
        editable={editable}
        onUpdate={(q) => onUpdateQty(item.id, q)}
      />

      {/* Remove */}
      {editable && <RemoveButton onClick={() => onRemove(item.id)} label="Remove" />}
    </div>
  );
}
