import { useState, type ReactNode } from "react";
import type { TalentEntry } from "../../types/Character";
import { TALENT_LIST } from "shared-rules";
import { TRAIT_LIST } from "../../data/reference/traitData";
import type { SkillSource } from "../../types/SkillSource";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiTextBody,
  uiTextLabel,
} from "../../ui/styles/editableStyles";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { sourceColour } from "../../ui/styles/sourceStyles";
import { colourAmberPlain } from "../../ui/styles/colourTokens";
import type { CustomItemLibraryActionProps } from "../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../ui/forms/CustomItemActionButtons";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { AccordionCard } from "../../ui/AccordionCard";
import { normaliseSources } from "./talentUtils";
import { recordComponentRender } from "../../performance/performanceMetrics";

interface EntryCardProps extends CustomItemLibraryActionProps<"trait"> {
  entry: TalentEntry;
  editable: boolean;
  onRemove: (uid: string) => void;
  confirmDeletion?: boolean;
  displayName?: string;
  secondaryText?: string;
  statusChip?: string;
  statusChipClassName?: string;
  removable?: boolean;
  deletionBlockedMessage?: string;
  statusAfterSource?: boolean;
  deletionNoun?: "Talent" | "Trait" | "Elite Advance";
  infoContent?: ReactNode;
}

export function EntryCard({
  entry,
  editable,
  onRemove,
  confirmDeletion = false,
  displayName,
  secondaryText,
  statusChip,
  statusChipClassName,
  removable = true,
  deletionBlockedMessage,
  statusAfterSource = false,
  deletionNoun = "Talent",
  infoContent,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
}: EntryCardProps) {
  recordComponentRender("TalentEntryCard");
  const [deleteArmed, setDeleteArmed] = useState(false);
  const shownName = displayName ?? entry.name;
  const isGranted = Boolean(entry.grantedByTalentEntryUid);
  const eliteAdvanceSource = entry.eliteAdvancePurchase?.sourceName;
  const description =
    TALENT_DESCRIPTIONS[entry.talentId] ?? TRAIT_DESCRIPTIONS[entry.talentId] ?? entry.description;
  const refData = (
    [...TALENT_LIST, ...TRAIT_LIST] as Array<{ id: string; source: SkillSource | SkillSource[] }>
  ).find((reference) => reference.id === entry.talentId);
  const refSources = refData
    ? normaliseSources(refData.source)
    : entry.source
      ? [entry.source]
      : [];

  return (
    <div className={uiSection + " flex items-start justify-between gap-2 text-sm lg:text-base"}>
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`${uiItemName} break-words`}>{shownName}</span>
          {(infoContent || description || entry.notes) && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={shownName}
                content={
                  infoContent ?? (
                    <div className="space-y-3">
                      {description && (
                        <p className={`text-sm ${uiTextBody} leading-relaxed`}>{description}</p>
                      )}
                      {entry.notes && (
                        <div>
                          <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
                          <div className="space-y-2">
                            {entry.notes.split("\n\n").map((group, index) => {
                              const breakAt = group.indexOf("\n");
                              const heading = breakAt === -1 ? group : group.slice(0, breakAt);
                              const body = breakAt === -1 ? "" : group.slice(breakAt + 1);
                              return (
                                <p
                                  key={index}
                                  className={`text-sm ${uiTextBody} leading-relaxed whitespace-pre-line`}
                                >
                                  <span className="font-semibold">{heading}</span>
                                  {body && `\n${body}`}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
              />
            </span>
          )}
        </div>
        {!statusAfterSource && secondaryText && (
          <p className={`text-sm ${colourAmberPlain}`}>{secondaryText}</p>
        )}
        {!statusAfterSource && isGranted && (
          <p className={`text-sm ${colourAmberPlain}`}>
            {entry.grantedByTalentName} ({entry.grantedByType}): Granted
          </p>
        )}
        {!statusAfterSource && eliteAdvanceSource && (
          <p className={`text-sm ${colourAmberPlain}`}>
            Gained from: {eliteAdvanceSource} (Elite Advance)
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {refSources.map((source) => (
            <Chip key={source} className={`bg-slate-800/40 font-code ${sourceColour(source)}`}>
              {source}
            </Chip>
          ))}
          {statusChip && (
            <Chip
              className={
                statusChipClassName ?? "border-amber-500/60 bg-amber-950/30 text-amber-300"
              }
            >
              {statusChip}
            </Chip>
          )}
        </div>
        {statusAfterSource && secondaryText && (
          <p className={`text-sm ${colourAmberPlain}`}>{secondaryText}</p>
        )}
        {statusAfterSource && isGranted && (
          <p className={`text-sm ${colourAmberPlain}`}>
            {entry.grantedByTalentName} ({entry.grantedByType}): Granted
          </p>
        )}
        {statusAfterSource && eliteAdvanceSource && (
          <p className={`text-sm ${colourAmberPlain}`}>
            Gained from: {eliteAdvanceSource} (Elite Advance)
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
            className="mt-1 flex flex-wrap gap-2"
          />
        )}
      </div>
      {editable && (removable || deletionBlockedMessage) && !isGranted && (
        <RemoveButton
          onClick={() =>
            deletionBlockedMessage || confirmDeletion ? setDeleteArmed(true) : onRemove(entry.uid)
          }
          label={`${confirmDeletion ? "Delete" : "Remove"} ${shownName}`}
          className="mt-0.5"
        />
      )}

      {deleteArmed && (
        <PickerModal
          title={
            deletionBlockedMessage ? `Cannot Delete ${deletionNoun}` : `Delete ${deletionNoun}`
          }
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            deletionBlockedMessage ? (
              <Button fullWidth variant="ghost" onClick={() => setDeleteArmed(false)}>
                Close
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={() => onRemove(entry.uid)}>
                  Delete
                </Button>
                <Button variant="neutral" onClick={() => setDeleteArmed(false)}>
                  Cancel
                </Button>
              </div>
            )
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              {deletionBlockedMessage ?? `Delete ${shownName} from this character?`}
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}

export function TalentGroupCard({
  name,
  entries,
  editable,
  onRemove,
  statusAfterSource = false,
  statusChip,
  statusChipClassName,
}: {
  name: string;
  entries: readonly TalentEntry[];
  editable: boolean;
  onRemove: (uid: string) => void;
  statusAfterSource?: boolean;
  statusChip?: string;
  statusChipClassName?: string;
}) {
  recordComponentRender("TalentGroupCard");
  const [expanded, setExpanded] = useState(false);
  return (
    <AccordionCard
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
      aria-label={`${expanded ? "Collapse" : "Expand"} ${name}`}
      header={
        <span className="block truncate text-sm font-semibold text-slate-100 lg:text-base">
          {name}
        </span>
      }
    >
      {expanded && (
        <div className="border-t border-slate-700 space-y-2 p-2">
          {[...entries]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <EntryCard
                key={entry.uid}
                entry={entry}
                editable={editable}
                onRemove={onRemove}
                confirmDeletion
                removable={!entry.grantedByTalentEntryUid}
                statusAfterSource={statusAfterSource}
                statusChip={statusChip}
                statusChipClassName={statusChipClassName}
              />
            ))}
        </div>
      )}
    </AccordionCard>
  );
}
