// src/pages/characterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { uiSection, uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";

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
  libraryItem?: CampaignCustomItem<"drug">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);
  const hasInfo = !!(ref?.effect || ref?.sideEffect || ref?.notes || item.notes);

  return (
    <div className={[uiSection, "flex items-center gap-3"].join(" ")}>
      {/* Name + duration + chips */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm lg:text-base font-medium text-slate-200">{item.name}</p>
          {libraryItem && (
            <StatusBadge status={libraryItem.status} />
          )}
          {hasInfo && (
            <span className="inline-flex items-center -translate-y-[1.4px]">
            <InfoModal
              title={item.name}
              content={
                <>
                  {ref?.duration && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Duration
                      </p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.duration}</p>
                    </div>
                  )}
                  {ref?.effect && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Effect
                      </p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.effect}</p>
                    </div>
                  )}
                  {ref?.sideEffect && (
                    <div>
                      <p className="text-xs lg:text-sm font-semibold text-red-500/70 uppercase tracking-wide mb-1">
                        Side Effects
                      </p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.sideEffect}</p>
                    </div>
                  )}
                  {ref?.notes && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Notes
                      </p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Player Notes
                      </p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.notes}</p>
                    </div>
                  )}
                </>
              }
            />
            </span>
          )}
        </div>
        {ref?.duration && <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5`}>Duration: {ref.duration}</p>}
        <ItemMetaChips
          weight={item.weight ?? ref?.weight ?? "0 kg"}
          value={item.value ?? ref?.value}
          availability={item.availability ?? ref?.availability}
          source={item.source}
          className="flex flex-wrap gap-1.5 mt-1"
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
      {editable && (
        <button
          onClick={() => onRemove(item.id)}
          className={`${uiActionButtonCompact} shrink-0`}
        >
          Remove
        </button>
      )}
    </div>
  );
}
