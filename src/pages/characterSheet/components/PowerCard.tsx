// src/pages/characterSheet/components/PowerCard.tsx

import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/Chip";
import { sourceColour } from "../../../ui/sourceStyles";
import type { PsychicPower } from "../../../types/Character";
import { disciplineColours } from "../psychicStyles";
import { uiSection, uiTextBody, uiTextPlaceholder, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { RemoveButton } from "../../../ui/RemoveButton";
import { StatChip } from "../../../ui/StatChip";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";

interface PowerCardProps extends CustomItemLibraryActionProps<"power"> {
  power: PsychicPower;
  editable: boolean;
  onRemove: (id: string) => void;
}

/** Shared stat row — used in both the card and the InfoModal header. */
function PowerStats({ power }: { power: PsychicPower }) {
  const sourceLabel = power.source ?? power.origin;
  const hasChips = sourceLabel || power.discipline;
  const hasStats = power.threshold || power.focusTime || power.range || power.sustained;

  if (!hasChips && !hasStats) return null;

  return (
    <div className="space-y-1.5">
      {hasChips && (
        <div className="flex flex-wrap items-center gap-x-3 lg:gap-x-4 gap-y-0.5 text-xs lg:text-sm">
          {sourceLabel && (
            <Chip className={`bg-slate-800/40 font-code ${sourceColour(sourceLabel)}`}>
              {sourceLabel}
            </Chip>
          )}
          {power.discipline && (
            <Chip className={disciplineColours[power.discipline] ?? disciplineColours.default}>
              {power.discipline}
            </Chip>
          )}
        </div>
      )}
      {hasStats && (
        <div className="flex flex-wrap gap-1.5">
          {power.threshold && <StatChip label="PT" value={power.threshold} />}
          {power.focusTime && <StatChip label="Action" value={power.focusTime} />}
          {power.range && <StatChip label="Range" value={power.range} />}
          {power.sustained && <StatChip label="Sustained" value={power.sustained} />}
        </div>
      )}
    </div>
  );
}

export function PowerCard({
  power,
  editable,
  onRemove,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
}: PowerCardProps) {
  const modalContent = (
    <>
      {power.description ? (
        <p className={`text-sm ${uiTextBody} leading-relaxed`}>{power.description}</p>
      ) : (
        <p className={`text-sm ${uiTextPlaceholder}`}>No description recorded.</p>
      )}
    </>
  );

  return (
    <div className={uiSection + " flex items-start justify-between gap-2 text-sm lg:text-base"}>
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-slate-100">
            {power.name || <span className={uiTextPlaceholder}>Unnamed power</span>}
          </p>
          <span className={uiInfoModalWrapper}>
            <InfoModal title={power.name || "Psychic Power"} content={modalContent} hideTitle />
          </span>
        </div>
        <PowerStats power={power} />
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

      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        {editable && (
          <RemoveButton
            onClick={() => onRemove(power.id)}
            label={`Remove ${power.name || "power"}`}
          />
        )}
      </div>
    </div>
  );
}
