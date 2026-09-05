// src/pages/CharacterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { uiSection, uiItemName, uiInfoModalWrapper } from "../../../ui/styles/editableStyles";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";

interface Props extends CustomItemLibraryActionProps<"gear"> {
  item: GearItem;
  editable: boolean;
  onRemove: () => void;
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
  const hasDesc = !!item.description?.trim();

  // Fall back to reference data for items saved before weight/value/availability were stored
  const ref = item.referenceId ? GEAR_REFERENCE.find((r) => r.id === item.referenceId) : undefined;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={uiItemName}>{item.name}</p>
            {libraryItem && <StatusBadge status={libraryItem.status} />}
            {hasDesc && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={item.name}
                  content={
                    <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                  }
                />
              </span>
            )}
          </div>
          <ItemMetaChips
            weight={weight}
            value={value}
            availability={availability}
            source={item.source}
            className="flex flex-wrap gap-1.5 mt-1"
          />
          {item.grantedByTalentName && (
            <p className="mt-1 text-xs text-amber-300">
              {item.grantedByTalentName} ({item.grantedByType}): Granted
            </p>
          )}
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

        {editable && !item.grantedByTalentEntryUid && (
          <RemoveButton onClick={onRemove} label="Remove" />
        )}
      </div>
    </div>
  );
}
