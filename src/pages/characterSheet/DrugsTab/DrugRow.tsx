// src/pages/characterSheet/DrugsTab/DrugRow.tsx

import type { DrugItem } from "../../../types/Character";
import { InfoModal } from "../../../components/InfoModal";
import { DRUGS_REFERENCE } from "../../../data/reference/drugsReference";
import { uiActionButtonCompact, uiSection, uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import type { CampaignCustomItem } from "../../../types/CustomItems";

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
            <span
              className={[
                "shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                libraryItem.status === "published"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : libraryItem.status === "draft"
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                    : "border-slate-500/50 bg-slate-800 text-slate-300",
              ].join(" ")}
            >
              {libraryItem.status}
            </span>
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
        {(canEditDefinition || isDM) && libraryItem && (
          <div className="mt-2 flex flex-wrap gap-2">
            {canEditDefinition && libraryItem.status !== "archived" && (
              <button type="button" onClick={onEditDefinition} className={uiActionButtonCompact}>
                Edit Definition
              </button>
            )}
            {isDM && libraryItem.status === "draft" && (
              <button
                type="button"
                onClick={onPublish}
                disabled={busyAction === "publish"}
                className={`${uiActionButtonCompact} disabled:opacity-50`}
              >
                {busyAction === "publish" ? "Publishing..." : "Publish"}
              </button>
            )}
            {isDM && libraryItem.status !== "archived" && (
              <button
                type="button"
                onClick={onArchive}
                disabled={busyAction === "archive"}
                className={`${uiActionButtonCompact} disabled:opacity-50`}
              >
                {busyAction === "archive" ? "Archiving..." : "Archive"}
              </button>
            )}
            {isDM && libraryItem.status === "published" && (
              <button
                type="button"
                onClick={onUpdateAllCopies}
                disabled={busyAction === "updateAll"}
                className={`${uiActionButtonCompact} disabled:opacity-50`}
              >
                {busyAction === "updateAll" ? "Updating..." : "Update All Copies"}
              </button>
            )}
          </div>
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
