// src/pages/CharacterSheet/PsychicTab/PowerCard.tsx

import { InfoModal } from "../../../components/InfoModal";
import { useState } from "react";
import { Chip } from "../../../ui/chips/Chip";
import { sourceChipColour } from "../../../ui/styles/sourceStyles";
import type { PsychicPower } from "../../../types/Character";
import { disciplineColours, psychicSelectionSourceColours } from "./psychicStyles";
import {
  uiChipRow,
  uiOverlayItemNameHover,
  uiSectionShell,
  uiTextPlaceholder,
  uiStackSection,
} from "../../../ui/styles/editableStyles";
import { Button } from "../../../ui/buttons/Button";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { StatChip } from "../../../ui/chips/StatChip";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { ExpandButton } from "../../../ui/buttons/ExpandButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { CharacterEntryRowContent } from "../../../ui/CharacterEntryRow";
import { InfoParagraph } from "../../../ui/InfoSection";

interface PowerCardProps extends CustomItemLibraryActionProps<"power"> {
  power: PsychicPower;
  editable: boolean;
  onRemove: (id: string) => void;
  onSelect?: () => void;
  selectLabel?: string;
  onLinkPurchase?: () => void;
  onLinkPsyRatingGrant?: () => void;
  talentSourceName?: string;
}

/** Shared stat row: used in both the card and the InfoModal header. */
function PowerIdentityChips({
  power,
  talentSourceName,
}: {
  power: PsychicPower;
  talentSourceName?: string;
}) {
  const sourceLabel = power.source ?? power.origin;
  if (!sourceLabel && !power.discipline && !power.talentEntryUid && !power.psyRatingTalentEntryUid)
    return null;

  return (
    <div className={`${uiChipRow} items-center text-xs lg:text-sm`}>
      {sourceLabel && (
        <Chip colour={sourceChipColour(sourceLabel)} className="font-code">
          {sourceLabel}
        </Chip>
      )}
      {power.discipline && (
        <Chip colour={disciplineColours[power.discipline] ?? disciplineColours.default}>
          {power.discipline}
        </Chip>
      )}
      {power.talentEntryUid && (
        <Chip colour={psychicSelectionSourceColours.talent}>
          {talentSourceName ?? "Talent purchase"}
        </Chip>
      )}
      {power.psyRatingTalentEntryUid && (
        <Chip colour={psychicSelectionSourceColours.psyRating}>
          {talentSourceName ?? "Psy Rating grant"}
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
      {power.threshold && <StatChip label="PT" value={power.threshold} />}
      {power.focusTime && <StatChip label="Action" value={power.focusTime} />}
      {power.range && <StatChip label="Range" value={power.range} />}
      {power.sustained && <StatChip label="Sustained" value={power.sustained} />}
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
  onLinkPurchase,
  onLinkPsyRatingGrant,
  talentSourceName,
}: PowerCardProps) {
  recordComponentRender("PowerCard");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${uiSectionShell} overflow-hidden`}>
      <div className={`${uiCardTapHeader} relative w-full p-3 lg:p-4 text-sm lg:text-base`}>
        <CardOverlayButton
          label={
            onSelect
              ? (selectLabel ?? `Select ${power.name || "psychic power"}`)
              : `${expanded ? "Collapse" : "Expand"} ${power.name || "psychic power"} details`
          }
          expanded={onSelect ? undefined : expanded}
          onClick={onSelect ?? (() => setExpanded((value) => !value))}
        />

        <CharacterEntryRowContent
          interactive
          name={power.name || <span className={uiTextPlaceholder}>Unnamed power</span>}
          nameClassName={uiOverlayItemNameHover}
          info={
            <InfoModal
              as="span"
              title={power.name || "Psychic Power"}
              content={
                power.description ? <InfoParagraph>{power.description}</InfoParagraph> : undefined
              }
            />
          }
          metadata={<PowerIdentityChips power={power} talentSourceName={talentSourceName} />}
          removeAction={
            editable ? (
              <RemoveEntryButton
                kind="Psychic Power"
                name={power.name || "power"}
                onRemove={() => onRemove(power.id)}
              />
            ) : undefined
          }
          expandControl={
            onSelect ? (
              <ExpandButton
                expanded={expanded}
                label={`${expanded ? "Collapse" : "Expand"} ${power.name || "psychic power"} details`}
                onClick={() => setExpanded((value) => !value)}
              />
            ) : (
              <ExpandChevron expanded={expanded} />
            )
          }
        />
      </div>

      {expanded && (
        <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${uiStackSection}`}>
          <PowerStats power={power} />

          {onLinkPurchase && (
            <Button size="sm" onClick={onLinkPurchase}>
              {power.isMinor || power.discipline === "Minor"
                ? "Use Minor Psychic Power selection"
                : "Use Psychic Power selection"}
            </Button>
          )}
          {onLinkPsyRatingGrant && (
            <Button size="sm" variant="secondary" onClick={onLinkPsyRatingGrant}>
              Use Psy Rating selection
            </Button>
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
