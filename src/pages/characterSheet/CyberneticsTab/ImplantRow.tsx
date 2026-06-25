// src/pages/characterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { Chip } from "../../../ui/Chip";
import { uiActionButtonCompact, uiSection, uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { CRAFTSMANSHIP_STYLE, LOCATION_DISPLAY } from "./cyberneticsConstants";
import { availableCraftsmanship, craftsmanshipDescription } from "./cyberneticsHelpers";
import { InfoModal } from "../../../components/InfoModal";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";

interface Props {
  item: CyberneticItem;
  editable: boolean;
  libraryItem?: CampaignCustomItem<"cybernetic">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onCycleQuality: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImplantRow({
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
  onCycleQuality,
  onRemove,
}: Props) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);
  const qualityOptions = availableCraftsmanship(ref);
  const canChangeQuality = editable && qualityOptions.length > 1;
  const displayedCraftsmanship = qualityOptions.includes(item.craftsmanship)
    ? item.craftsmanship
    : qualityOptions[0];
  const qualityDescription = ref
    ? craftsmanshipDescription(ref, displayedCraftsmanship)
    : (item.notes ?? "No rules recorded.");

  return (
    <div className={[uiSection, "flex items-start gap-3"].join(" ")}>
      {/* Name + craftsmanship description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm lg:text-base font-medium text-slate-200 truncate">{item.name}</p>
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
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <InfoModal
              title={item.name}
              content={
                <div className="space-y-3">
                  {ref?.notes && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Item Rules
                      </p>
                      <p className={`text-sm ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <p className={`${uiTextLabel} font-semibold mb-1`}>
                        Notes
                      </p>
                      <p className={`text-sm ${uiTextBody} leading-relaxed`}>{item.notes}</p>
                    </div>
                  )}
                </div>
              }
            />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <Chip className={`border-slate-700 bg-slate-800/40 ${uiTextMuted}`}>
              {item.bodyLocation.map((l) => LOCATION_DISPLAY[l]).join(" & ")}
            </Chip>
          )}
          <ItemMetaChips
            bare
            value={item.value ?? ref?.value}
            availability={item.availability ?? ref?.availability}
            source={item.source ?? ref?.source}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Quality</span>
          <Chip
            as="button"
            type="button"
            onClick={() => canChangeQuality && onCycleQuality(item.id)}
            title={
              canChangeQuality
                ? `Click to change quality (currently ${displayedCraftsmanship})`
                : displayedCraftsmanship
            }
            disabled={!canChangeQuality}
            className={[
              CRAFTSMANSHIP_STYLE[displayedCraftsmanship],
              canChangeQuality ? "cursor-pointer hover:opacity-80" : "cursor-default",
              "transition shrink-0",
            ].join(" ")}
          >
            {displayedCraftsmanship}
          </Chip>
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <InfoModal
              title={`${displayedCraftsmanship} ${item.name}`}
              content={qualityDescription}
            />
          </span>
        </div>
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

      {/* Info button */}
      <button onClick={() => undefined} title="View rules" className="hidden">
        ⓘ
      </button>

      {/* Craftsmanship badge — clickable when editable */}
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
