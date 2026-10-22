import { useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type {
  InsanityDisorderEntry,
  InsanityDisorderSeverity,
  InsanityTraumaEntry,
} from "../../types/Character";
import { AddButton } from "../../ui/buttons/AddButton";
import { Button } from "../../ui/buttons/Button";
import { EntryActionButton } from "../../ui/buttons/EntryActionButton";
import { OwnedEntryRow } from "../../ui/OwnedEntryRow";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { Chip } from "../../ui/chips/Chip";
import { RollChip } from "../../ui/chips/RollChip";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { SectionHeader } from "../../ui/SectionHeader";
import {
  uiSplitRow,
  uiInfoModalWrapper,
  uiTextBody,
  uiTextPlaceholder,
  uiTextDescription,
  uiStackList,
} from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import {
  getInsanityDisorderRef,
  getMentalTraumaRef,
  getNextDisorderSeverity,
  INSANITY_RULE_TEXT,
  INSANITY_SEVERITIES,
} from "./insanityReference";
import { disorderTypeChipColour, severityChipColour } from "./insanityUi";

function severityDescription(severity: InsanityDisorderSeverity): string {
  return INSANITY_SEVERITIES.find((entry) => entry.severity === severity)?.description ?? "";
}

function DisorderRow({
  disorder,
  editable,
  onRemove,
  onEscalate,
}: {
  disorder: InsanityDisorderEntry;
  editable: boolean;
  onRemove: () => void;
  onEscalate: (severity: InsanityDisorderSeverity) => void | Promise<boolean | void>;
}) {
  const [escalateArmed, setEscalateArmed] = useState(false);
  const ref = getInsanityDisorderRef(disorder.referenceId);
  const nextSeverity = getNextDisorderSeverity(disorder);

  return (
    <>
      <OwnedEntryRow
        name={disorder.name}
        editable={editable}
        information={
          <DisorderInfoContent
            type={ref?.type ?? disorder.type}
            name={ref?.name ?? disorder.name}
            description={ref?.description ?? disorder.notes ?? "Custom disorder."}
            typeDescription={ref?.typeDescription}
            notes={disorder.notes}
          />
        }
        chips={
          <>
            <Chip colour={disorderTypeChipColour(disorder.type)}>{disorder.type}</Chip>
            <span className="inline-flex items-center gap-1">
              <Chip colour={severityChipColour[disorder.severity]}>{disorder.severity}</Chip>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={disorder.severity}
                  content={
                    <p className={uiTextDescription}>{severityDescription(disorder.severity)}</p>
                  }
                />
              </span>
            </span>
            {disorder.source && (
              <Chip colour={sourceChipColour(disorder.source)} className="font-code">
                {disorder.source}
              </Chip>
            )}
          </>
        }
        actions={
          editable && nextSeverity ? (
            <EntryActionButton onClick={() => setEscalateArmed(true)}>
              Escalate to {nextSeverity}
            </EntryActionButton>
          ) : undefined
        }
        removal={{ kind: "Disorder", onRemove }}
      />
      {escalateArmed && nextSeverity && (
        <PickerModal
          title={`Escalate to ${nextSeverity}`}
          query=""
          onQueryChange={() => undefined}
          onClose={() => setEscalateArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={async () => {
                  const saved = await onEscalate(nextSeverity);
                  if (saved !== false) setEscalateArmed(false);
                }}
              >
                Escalate
              </Button>
              <Button variant="neutral" onClick={() => setEscalateArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Escalate {disorder.name} to {nextSeverity}?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </>
  );
}

function traumaDisplayName(trauma: InsanityTraumaEntry): string {
  return trauma.name ?? getMentalTraumaRef(trauma.referenceId)?.name ?? trauma.roll ?? "";
}

function TraumaRow({
  trauma,
  editable,
  onRemove,
}: {
  trauma: InsanityTraumaEntry;
  editable: boolean;
  onRemove: () => void;
}) {
  const ref = getMentalTraumaRef(trauma.referenceId);
  const name = trauma.name ?? ref?.name ?? "Custom Trauma";
  const roll = ref?.roll ?? trauma.roll;
  const effect = ref?.effect ?? trauma.effect ?? trauma.notes ?? "Custom trauma.";

  return (
    <OwnedEntryRow
      name={name}
      editable={editable}
      information={<p className={uiTextDescription}>{effect}</p>}
      chips={
        roll || trauma.source ? (
          <>
            {roll && <RollChip>{roll}</RollChip>}
            {trauma.source && (
              <Chip colour={sourceChipColour(trauma.source)} className="font-code">
                {trauma.source}
              </Chip>
            )}
          </>
        ) : undefined
      }
      removal={{ kind: "Trauma", onRemove }}
    />
  );
}

export function TraumaHeader({ editable, onAdd }: { editable: boolean; onAdd: () => void }) {
  return (
    <div className={`${uiSplitRow}`}>
      <span className="inline-flex items-center gap-1.5">
        <SectionHeader>Temporary Trauma</SectionHeader>
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title="Mental Trauma"
            content={<p className={uiTextDescription}>{INSANITY_RULE_TEXT.trauma}</p>}
          />
        </span>
      </span>
      {editable ? (
        <AddButton label="Add Trauma" onClick={onAdd} />
      ) : (
        <ViewButton label="View Temporary Trauma" onClick={onAdd} />
      )}
    </div>
  );
}

export function TraumaList({
  trauma,
  editable,
  onRemove,
}: {
  trauma: InsanityTraumaEntry[];
  editable: boolean;
  onRemove: (id: string) => void;
}) {
  if (trauma.length === 0) {
    return (
      <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No temporary trauma recorded.</p>
    );
  }
  return (
    <div className={uiStackList}>
      {[...trauma]
        .sort((a, b) => traumaDisplayName(a).localeCompare(traumaDisplayName(b)))
        .map((entry) => (
          <TraumaRow
            key={entry.id}
            trauma={entry}
            editable={editable}
            onRemove={() => onRemove(entry.id)}
          />
        ))}
    </div>
  );
}

export function DisordersHeader({ editable, onAdd }: { editable: boolean; onAdd: () => void }) {
  return (
    <div className={`${uiSplitRow}`}>
      <SectionHeader>Disorders</SectionHeader>
      {editable ? (
        <AddButton label="Add Disorder" onClick={onAdd} />
      ) : (
        <ViewButton label="View Disorders" onClick={onAdd} />
      )}
    </div>
  );
}

export function DisordersList({
  disorders,
  legacyDisorders,
  editable,
  onRemove,
  onEscalate,
  onLegacyChange,
}: {
  disorders: InsanityDisorderEntry[];
  legacyDisorders: string;
  editable: boolean;
  onRemove: (id: string) => void;
  onEscalate: (id: string, severity: InsanityDisorderSeverity) => void | Promise<boolean | void>;
  onLegacyChange: (notes: string) => void;
}) {
  if (disorders.length > 0) {
    return (
      <div className={uiStackList}>
        {[...disorders]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((disorder) => (
            <DisorderRow
              key={disorder.id}
              disorder={disorder}
              editable={editable}
              onRemove={() => onRemove(disorder.id)}
              onEscalate={(severity) => onEscalate(disorder.id, severity)}
            />
          ))}
        {legacyDisorders.trim() && (
          <FormField
            label="Disorder Notes"
            value={legacyDisorders}
            onChange={onLegacyChange}
            editable={editable}
            type="textarea"
            rows={2}
            placeholder="Additional disorder notes..."
          />
        )}
      </div>
    );
  }

  if (legacyDisorders.trim()) {
    return (
      <FormField
        label="Legacy Disorder Notes"
        value={legacyDisorders}
        onChange={onLegacyChange}
        editable={editable}
        type="textarea"
        rows={2}
        placeholder="List any disorders..."
      />
    );
  }

  return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No disorders recorded.</p>;
}
