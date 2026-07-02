import { useCallback, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Stepper } from "../../components/Stepper";
import type { CorruptionBlock, CorruptionMalignancyEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import { colourAmberFaint, colourInactive, colourRose } from "../../ui/colourTokens";
import {
  uiCell,
  uiFormLabel,
  uiInfoModalWrapper,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { CorruptionMalignancyPicker } from "./CorruptionMalignancyPicker";
import { MalignancyInfoContent } from "./CorruptionReferenceModals";
import {
  CORRUPTION_RULE_TEXT,
  getCorruptionMalignancyRef,
  getCorruptionTrackEntry,
  getNextCorruptionTrackEntry,
} from "./corruptionReference";
import {
  corruptionDegreeChipClass,
  malignancyModifierChipClass,
  mutationChipClass,
} from "./corruptionUi";

interface CorruptionPanelProps {
  corruption?: CorruptionBlock;
  editable: boolean;
  onUpdate: (next: CorruptionBlock) => void;
  sectionClassName: string;
}

function CorruptionStatusChips({ points }: { points: number }) {
  const safePoints = Math.max(0, Math.floor(points || 0));
  const entry = getCorruptionTrackEntry(safePoints);
  const next = getNextCorruptionTrackEntry(safePoints);

  const malignancyTestInfo = (
    <span className={uiInfoModalWrapper}>
      <InfoModal
        title="The Malignancy Test"
        content={<p className="text-sm leading-relaxed text-slate-300 lg:text-base">{CORRUPTION_RULE_TEXT.malignancyTest}</p>}
      />
    </span>
  );
  const mutationInfo = (
    <span className={uiInfoModalWrapper}>
      <InfoModal
        title="Mutation"
        content={<p className="text-sm leading-relaxed text-slate-300 lg:text-base">{CORRUPTION_RULE_TEXT.mutation}</p>}
      />
    </span>
  );

  if (safePoints <= 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip className={colourInactive}>No Corruption</Chip>
          <span className="inline-flex items-center gap-1">
            <Chip className={colourInactive}>No Malignancy Test</Chip>
            {malignancyTestInfo}
          </span>
          <span className="inline-flex items-center gap-1">
            <Chip className={colourInactive}>No Mutation Test</Chip>
            {mutationInfo}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip className={corruptionDegreeChipClass(entry)}>{entry.degree}</Chip>
        <span className="inline-flex items-center gap-1">
          <Chip className={entry.terminal ? colourRose : malignancyModifierChipClass(entry)}>
            {entry.terminal ? "Removed from Play" : `Malignancy Test ${entry.malignancyModifier}`}
          </Chip>
          {!entry.terminal && malignancyTestInfo}
        </span>
        {!entry.terminal && (
          <span className="inline-flex items-center gap-1">
            <Chip className={mutationChipClass(entry)}>
              {entry.mutation || "No Mutation Test"}
            </Chip>
            {mutationInfo}
          </span>
        )}
      </div>
      {next && !entry.terminal && (
        <p className={`text-[10px] lg:text-xs ${uiTextMuted}`}>
          {next.min - safePoints} points until {next.degree}
        </p>
      )}
    </div>
  );
}

function MalignancyRow({
  malignancy,
  editable,
  onRemove,
}: {
  malignancy: CorruptionMalignancyEntry;
  editable: boolean;
  onRemove: () => void;
}) {
  const ref = getCorruptionMalignancyRef(malignancy.referenceId);
  const display = {
    roll: ref?.roll ?? malignancy.roll,
    name: ref?.name ?? malignancy.name,
    effect: ref?.effect ?? malignancy.effect,
  };

  return (
    <div className={`${uiCell} px-2 py-2 lg:px-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-200 lg:text-base">{display.name}</span>
          {display.roll && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip size="sm" className={colourAmberFaint}>{display.roll}</Chip>
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={display.name}
                content={<MalignancyInfoContent malignancy={display} notes={malignancy.notes} hideName />}
              />
            </span>
          </div>
        </div>
        {editable && (
          <button type="button" onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function CorruptionPanel({ corruption, editable, onUpdate, sectionClassName }: CorruptionPanelProps) {
  const value = corruption ?? { points: 0, malignancies: [] };
  const [showMalignancyPicker, setShowMalignancyPicker] = useState(false);
  const structuredMalignancies = Array.isArray(value.malignancies) ? value.malignancies : [];
  const legacyMalignancies = typeof value.malignancies === "string" ? value.malignancies : value.malignancyNotes ?? "";

  const handlePointsChange = useCallback(
    (points: number) => onUpdate({ ...value, points }),
    [value, onUpdate]
  );

  const handleLegacyMalignanciesChange = useCallback(
    (notes: string) =>
      onUpdate(
        Array.isArray(value.malignancies)
          ? { ...value, malignancyNotes: notes }
          : { ...value, malignancies: notes }
      ),
    [value, onUpdate]
  );

  const handleAddMalignancy = useCallback(
    (entry: CorruptionMalignancyEntry) =>
      onUpdate({
        ...value,
        malignancies: [...structuredMalignancies, entry],
        malignancyNotes: legacyMalignancies.trim() ? legacyMalignancies : value.malignancyNotes,
      }),
    [value, structuredMalignancies, legacyMalignancies, onUpdate]
  );

  const handleRemoveMalignancy = useCallback(
    (id: string) =>
      onUpdate({
        ...value,
        malignancies: structuredMalignancies.filter((entry) => entry.id !== id),
      }),
    [value, structuredMalignancies, onUpdate]
  );

  return (
    <div>
      <SectionHeader className="mb-2">Corruption</SectionHeader>
      <section className={`${sectionClassName} space-y-3`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs lg:text-sm text-slate-100 uppercase tracking-wide">Points</span>
            <Stepper value={value.points} editable={editable} onChange={handlePointsChange} />
          </div>
          <CorruptionStatusChips points={value.points} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={uiFormLabel}>Malignancies</span>
            {editable && (
              <button
                type="button"
                onClick={() => setShowMalignancyPicker(true)}
                className={uiActionButtonCompact}
              >
                + Add
              </button>
            )}
          </div>

          {structuredMalignancies.length > 0 ? (
            <div className="space-y-2">
              {structuredMalignancies.map((malignancy) => (
                <MalignancyRow
                  key={malignancy.id}
                  malignancy={malignancy}
                  editable={editable}
                  onRemove={() => handleRemoveMalignancy(malignancy.id)}
                />
              ))}
              {legacyMalignancies.trim() && (
                <FormField
                  label="Malignancy Notes"
                  value={legacyMalignancies}
                  onChange={handleLegacyMalignanciesChange}
                  editable={editable}
                  type="textarea"
                  rows={2}
                  placeholder="Additional malignancy notes..."
                />
              )}
            </div>
          ) : legacyMalignancies.trim() ? (
            <FormField
              label="Legacy Malignancy Notes"
              value={legacyMalignancies}
              onChange={handleLegacyMalignanciesChange}
              editable={editable}
              type="textarea"
              rows={2}
              placeholder="List any malignancies..."
            />
          ) : (
            <div className={`${uiCell} px-2 py-2`}>
              <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No malignancies recorded.</p>
            </div>
          )}
        </div>
      </section>

      {showMalignancyPicker && (
        <CorruptionMalignancyPicker
          onAdd={handleAddMalignancy}
          onClose={() => setShowMalignancyPicker(false)}
        />
      )}
    </div>
  );
}
