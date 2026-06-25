// src/pages/characterSheet/GearTab/ItemRow.tsx

import type { GearItem } from "../../../types/Character";
import { GEAR_REFERENCE } from "../../../data/reference/gearReference";
import { uiActionButtonCompact, uiSection } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import type { CampaignCustomItem } from "../../../types/CustomItems";

interface Props {
  item: GearItem;
  editable: boolean;
  libraryItem?: CampaignCustomItem<"gear">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
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
            {hasDesc && (
              <span className="inline-flex items-center -translate-y-[1.4px]">
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
          {(canEditDefinition || isDM) && libraryItem && (
            <div className="mt-2 flex flex-wrap gap-2">
              {canEditDefinition && libraryItem.status !== "archived" && (
                <button
                  type="button"
                  onClick={onEditDefinition}
                  className={uiActionButtonCompact}
                >
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

        {editable && (
          <button
            onClick={onRemove}
            className={`${uiActionButtonCompact} shrink-0`}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
