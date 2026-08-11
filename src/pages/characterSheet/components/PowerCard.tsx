// src/pages/characterSheet/components/PowerCard.tsx

import { InfoModal } from "../../../components/InfoModal";
import { useState } from "react";
import { Chip } from "../../../ui/Chip";
import { sourceColour } from "../../../ui/sourceStyles";
import type { PsychicPower } from "../../../types/Character";
import { disciplineColours } from "../psychicStyles";
import {
  uiCardTitle,
  uiInfoModalWrapper,
  uiSectionShell,
  uiTextBody,
  uiTextPlaceholder,
} from "../../../ui/editableStyles";
import { RemoveButton } from "../../../ui/RemoveButton";
import { StatChip } from "../../../ui/StatChip";
import { ExpandChevron } from "../../../ui/ExpandChevron";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";

interface PowerCardProps extends CustomItemLibraryActionProps<"power"> {
  power: PsychicPower;
  editable: boolean;
  onRemove: (id: string) => void;
  onSelect?: () => void;
  selectLabel?: string;
}

/** Shared stat row — used in both the card and the InfoModal header. */
function PowerIdentityChips({ power }: { power: PsychicPower }) {
  const sourceLabel = power.source ?? power.origin;
  if (!sourceLabel && !power.discipline) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
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
  );
}

function PowerStats({ power }: { power: PsychicPower }) {
  const hasStats = power.threshold || power.focusTime || power.range || power.sustained;
  if (!hasStats) return null;

  return (
    <div className="grid grid-cols-4 gap-[clamp(2px,1vw,6px)] lg:flex lg:flex-wrap lg:gap-1.5">
      {power.threshold && <StatChip compactOnMobile label="PT" value={power.threshold} />}
      {power.focusTime && <StatChip compactOnMobile label="Action" value={power.focusTime} />}
      {power.range && <StatChip compactOnMobile label="Range" value={power.range} />}
      {power.sustained && <StatChip compactOnMobile label="Sustained" value={power.sustained} />}
    </div>
  );
}

export function PowerCard({
  power,
  editable,
  onRemove,
  onSelect,
  selectLabel,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
}: PowerCardProps) {
  const [expanded, setExpanded] = useState(false);

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
    <div className={`${uiSectionShell} overflow-hidden`}>
      <div className="relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4 text-sm lg:text-base group">
        <button
          type="button"
          onClick={onSelect ?? (() => setExpanded((value) => !value))}
          aria-expanded={onSelect ? undefined : expanded}
          aria-label={
            onSelect
              ? (selectLabel ?? `Select ${power.name || "psychic power"}`)
              : `${expanded ? "Collapse" : "Expand"} ${power.name || "psychic power"} details`
          }
          className="absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        />

        <div className="relative pointer-events-none min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <p className={`${uiCardTitle} ${onSelect ? "group-hover:text-white" : ""}`}>
              {power.name || <span className={uiTextPlaceholder}>Unnamed power</span>}
            </p>
            <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
              <InfoModal
                as="span"
                title={power.name || "Psychic Power"}
                content={modalContent}
                hideTitle
              />
            </span>
          </div>
          <PowerIdentityChips power={power} />
        </div>

        <div className="relative pointer-events-none flex items-center shrink-0">
          {onSelect ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${power.name || "psychic power"} details`}
              className="relative z-10 pointer-events-auto p-1 -m-1"
            >
              <ExpandChevron expanded={expanded} />
            </button>
          ) : (
            <ExpandChevron expanded={expanded} />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-3">
          <PowerStats power={power} />

          {editable && (
            <div className="flex justify-end">
              <RemoveButton
                onClick={() => onRemove(power.id)}
                label={`Remove ${power.name || "power"}`}
              />
            </div>
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
      )}
    </div>
  );
}
