import { useState, type ReactNode } from "react";
import type { TalentEntry } from "../../types/Character";
import { TALENT_LIST } from "shared-rules";
import { TRAIT_LIST } from "../../data/reference/traitData";
import type { SkillSource } from "../../types/SkillSource";
import { uiTextDescription, uiStackBody, uiStackList } from "../../ui/styles/editableStyles";
import { InfoParagraph, InfoSection } from "../../ui/InfoSection";
import { Chip } from "../../ui/chips/Chip";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { type ChipColour, colourTextPrimary, colourDivider } from "../../ui/styles/colourTokens";
import type { CustomItemLibraryActionProps } from "../../types/CustomItemActions";
import { AccordionCard } from "../../ui/AccordionCard";
import { normaliseSources } from "./talentUtils";
import { hasRestorableTalentEffect } from "./talentRemovalRules";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { OwnedEntryRow } from "../../ui/OwnedEntryRow";

interface EntryCardProps extends CustomItemLibraryActionProps<"trait"> {
  entry: TalentEntry;
  editable: boolean;
  onRemove: (uid: string, restoreOneTimeEffects?: boolean) => void | Promise<unknown>;
  displayName?: string;
  statusChip?: string;
  statusChipColour?: ChipColour;
  removable?: boolean;
  removalBlockedMessage?: string;
  removalNoun?: "Talent" | "Trait" | "Elite Advance";
  infoContent?: ReactNode;
}

export function EntryCard({
  entry,
  editable,
  onRemove,
  displayName,
  statusChip,
  statusChipColour,
  removable = true,
  removalBlockedMessage,
  removalNoun = "Talent",
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

  const hasInformation = Boolean(infoContent || description || entry.notes);
  const information = hasInformation
    ? (infoContent ?? (
        <div className={uiStackBody}>
          {description && <InfoParagraph>{description}</InfoParagraph>}
          {entry.notes && (
            <InfoSection heading="Notes">
              <div className={uiStackList}>
                {entry.notes.split("\n\n").map((group, index) => {
                  const breakAt = group.indexOf("\n");
                  const heading = breakAt === -1 ? group : group.slice(0, breakAt);
                  const body = breakAt === -1 ? "" : group.slice(breakAt + 1);
                  return (
                    <p key={index} className={`${uiTextDescription} whitespace-pre-line`}>
                      <span className="font-semibold">{heading}</span>
                      {body && `\n${body}`}
                    </p>
                  );
                })}
              </div>
            </InfoSection>
          )}
        </div>
      ))
    : undefined;

  const gainedFrom = isGranted
    ? `${entry.grantedByTalentName} (${entry.grantedByType})`
    : eliteAdvanceSource
      ? `${eliteAdvanceSource} (Elite Advance)`
      : undefined;

  return (
    <OwnedEntryRow
      name={shownName}
      editable={editable}
      information={information}
      chips={
        <>
          {refSources.map((source) => (
            <Chip key={source} colour={sourceChipColour(source)} className="font-code">
              {source}
            </Chip>
          ))}
          {statusChip && <Chip colour={statusChipColour ?? "amber"}>{statusChip}</Chip>}
        </>
      }
      lines={{ gainedFrom }}
      library={{
        libraryItem,
        isDM,
        canEditDefinition,
        busyAction,
        onEditDefinition,
        onPublish,
        onArchive,
        onUpdateAllCopies,
      }}
      removal={{
        kind: removalNoun,
        onRemove: () => onRemove(entry.uid, false),
        hidden: !((removable || removalBlockedMessage) && !isGranted),
        blockedMessage: removalBlockedMessage,
        extra: hasRestorableTalentEffect(entry)
          ? {
              label: "Remove and restore recorded changes",
              message: `${shownName} recorded a one-time change. Remove the Talent only, or remove it and restore what that acquisition changed?`,
              onClick: () => onRemove(entry.uid, true),
            }
          : undefined,
      }}
    />
  );
}

export function TalentGroupCard({
  name,
  entries,
  editable,
  onRemove,
  statusChip,
  statusChipColour,
}: {
  name: string;
  entries: readonly TalentEntry[];
  editable: boolean;
  onRemove: (uid: string, restoreOneTimeEffects?: boolean) => void | Promise<unknown>;
  statusChip?: string;
  statusChipColour?: ChipColour;
}) {
  recordComponentRender("TalentGroupCard");
  const [expanded, setExpanded] = useState(false);
  return (
    <AccordionCard
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
      aria-label={`${expanded ? "Collapse" : "Expand"} ${name}`}
      header={
        <span className={`block truncate text-sm font-semibold ${colourTextPrimary} lg:text-base`}>
          {name}
        </span>
      }
    >
      {expanded && (
        <div className={`border-t ${colourDivider} ${uiStackList} p-2`}>
          {[...entries]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <EntryCard
                key={entry.uid}
                entry={entry}
                editable={editable}
                onRemove={onRemove}
                removable={!entry.grantedByTalentEntryUid}
                statusChip={statusChip}
                statusChipColour={statusChipColour}
              />
            ))}
        </div>
      )}
    </AccordionCard>
  );
}
