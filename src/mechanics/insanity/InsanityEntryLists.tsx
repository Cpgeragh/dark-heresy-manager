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
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { Chip } from "../../ui/chips/Chip";
import { RollChip } from "../../ui/chips/RollChip";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { SectionHeader } from "../../ui/SectionHeader";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { sourceColour } from "../../ui/styles/sourceStyles";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import {
  getInsanityDisorderRef,
  getMentalTraumaRef,
  getNextDisorderSeverity,
  INSANITY_RULE_TEXT,
  INSANITY_SEVERITIES,
} from "./insanityReference";
import { disorderTypeChipClass, severityChipClass } from "./insanityUi";

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
  onEscalate: (severity: InsanityDisorderSeverity) => void;
}) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [escalateArmed, setEscalateArmed] = useState(false);
  const ref = getInsanityDisorderRef(disorder.referenceId);
  const nextSeverity = getNextDisorderSeverity(disorder);

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={uiItemName}>{disorder.name}</span>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={disorderTypeChipClass(disorder.type)}>
              {disorder.type}
            </Chip>
            <span className="inline-flex items-center gap-1">
              <Chip size="sm" className={severityChipClass[disorder.severity]}>
                {disorder.severity}
              </Chip>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={disorder.severity}
                  content={
                    <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                      {severityDescription(disorder.severity)}
                    </p>
                  }
                />
              </span>
            </span>
            {disorder.source && (
              <Chip
                size="sm"
                className={`bg-slate-800/40 font-code ${sourceColour(disorder.source)}`}
              >
                {disorder.source}
              </Chip>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={disorder.name}
                content={
                  <DisorderInfoContent
                    type={ref?.type ?? disorder.type}
                    name={ref?.name ?? disorder.name}
                    description={ref?.description ?? disorder.notes ?? "Custom disorder."}
                    typeDescription={ref?.typeDescription}
                    notes={disorder.notes}
                  />
                }
              />
            </span>
          </div>
        </div>
        {editable && (
          <div className="flex shrink-0 gap-1.5">
            {nextSeverity && (
              <Button size="xs" onClick={() => setEscalateArmed(true)}>
                Escalate to {nextSeverity}
              </Button>
            )}
            <RemoveButton onClick={() => setDeleteArmed(true)} label="Remove" />
          </div>
        )}
      </div>
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
                onClick={() => {
                  onEscalate(nextSeverity);
                  setEscalateArmed(false);
                }}
              >
                Escalate
              </Button>
              <Button variant="ghost" onClick={() => setEscalateArmed(false)}>
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
      {deleteArmed && (
        <PickerModal
          title="Delete Disorder"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={onRemove}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setDeleteArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Delete {disorder.name} from this character?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
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
  const [deleteArmed, setDeleteArmed] = useState(false);
  const ref = getMentalTraumaRef(trauma.referenceId);
  const name = trauma.name ?? ref?.name ?? "Custom Trauma";
  const roll = ref?.roll ?? trauma.roll;
  const effect = ref?.effect ?? trauma.effect ?? trauma.notes ?? "Custom trauma.";

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={uiItemName}>{name}</span>
          {(roll || trauma.source) && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {roll && <RollChip>{roll}</RollChip>}
              {trauma.source && (
                <Chip
                  size="sm"
                  className={`bg-slate-800/40 font-code ${sourceColour(trauma.source)}`}
                >
                  {trauma.source}
                </Chip>
              )}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={name}
                content={
                  <p className="text-sm leading-relaxed text-slate-300 lg:text-base">{effect}</p>
                }
              />
            </span>
          </div>
        </div>
        {editable && <RemoveButton onClick={() => setDeleteArmed(true)} label="Remove" />}
      </div>
      {deleteArmed && (
        <PickerModal
          title="Delete Trauma"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={onRemove}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setDeleteArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Delete {name} from this character?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}

export function TraumaHeader({ editable, onAdd }: { editable: boolean; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5">
        <SectionHeader>Temporary Trauma</SectionHeader>
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title="Mental Trauma"
            content={
              <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                {INSANITY_RULE_TEXT.trauma}
              </p>
            }
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
    <div className="space-y-2">
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
    <div className="flex items-center justify-between gap-2">
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
  onEscalate: (id: string, severity: InsanityDisorderSeverity) => void;
  onLegacyChange: (notes: string) => void;
}) {
  if (disorders.length > 0) {
    return (
      <div className="space-y-2">
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
