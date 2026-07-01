import { useCallback, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Stepper } from "../../components/Stepper";
import type { InsanityBlock, InsanityDisorderEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import { colourInactive, colourRose } from "../../ui/colourTokens";
import {
  uiCell,
  uiFormLabel,
  uiInfoModalWrapper,
  uiTextMuted,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { InsanityDisorderPicker } from "./InsanityDisorderPicker";
import { DisorderInfoContent, InsanityReferenceModals } from "./InsanityReferenceModals";
import {
  getInsanityDisorderRef,
  getInsanityTrackEntry,
  getNextInsanityTrackEntry,
} from "./insanityReference";
import { inactiveChipClass, insanityDegreeChipClass, severityChipClass } from "./insanityUi";

interface InsanityPanelProps {
  insanity?: InsanityBlock;
  editable: boolean;
  onUpdate: (next: InsanityBlock) => void;
  sectionClassName: string;
}

function InsanityStatusChips({ points }: { points: number }) {
  const entry = getInsanityTrackEntry(points);
  const next = getNextInsanityTrackEntry(points);
  const traumaLabel = entry.terminal
    ? "No Trauma Test"
    : entry.traumaModifier === "n/a"
      ? "No Trauma"
      : `Trauma Test ${entry.traumaModifier}`;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Chip className={insanityDegreeChipClass(entry)}>{entry.degree}</Chip>
        <Chip className={entry.terminal ? colourRose : colourInactive}>{traumaLabel}</Chip>
        <Chip className={entry.disorder ? severityChipClass[entry.disorder] : inactiveChipClass}>
          {entry.disorderLabel}
        </Chip>
      </div>
      {next && !entry.terminal && (
        <p className="text-[10px] lg:text-xs text-slate-500">
          {next.min - Math.max(0, points)} points until {next.degree}
        </p>
      )}
    </div>
  );
}

function DisorderRow({
  disorder,
  editable,
  onRemove,
}: {
  disorder: InsanityDisorderEntry;
  editable: boolean;
  onRemove: () => void;
}) {
  const ref = getInsanityDisorderRef(disorder.referenceId);
  const description = disorder.notes || ref?.description;

  return (
    <div className={`${uiCell} px-2 py-2 lg:px-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-slate-200 lg:text-base">
              {disorder.type === disorder.name ? disorder.name : `${disorder.type}: ${disorder.name}`}
            </span>
            <Chip size="sm" className={severityChipClass[disorder.severity]}>{disorder.severity}</Chip>
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
          {description && <p className={`mt-1 line-clamp-2 text-xs lg:text-sm ${uiTextMuted}`}>{description}</p>}
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

export function InsanityPanel({ insanity, editable, onUpdate, sectionClassName }: InsanityPanelProps) {
  const value = insanity ?? { points: 0, disorders: [] };
  const [showDisorderPicker, setShowDisorderPicker] = useState(false);
  const structuredDisorders = Array.isArray(value.disorders) ? value.disorders : [];
  const legacyDisorders = typeof value.disorders === "string" ? value.disorders : value.disorderNotes ?? "";

  const handlePointsChange = useCallback(
    (points: number) => onUpdate({ ...value, points }),
    [value, onUpdate]
  );

  const handleLegacyDisordersChange = useCallback(
    (notes: string) =>
      onUpdate(
        Array.isArray(value.disorders)
          ? { ...value, disorderNotes: notes }
          : { ...value, disorders: notes }
      ),
    [value, onUpdate]
  );

  const handleAddDisorder = useCallback(
    (entry: InsanityDisorderEntry) =>
      onUpdate({
        ...value,
        disorders: [...structuredDisorders, entry],
        disorderNotes: legacyDisorders.trim() ? legacyDisorders : value.disorderNotes,
      }),
    [value, structuredDisorders, legacyDisorders, onUpdate]
  );

  const handleRemoveDisorder = useCallback(
    (id: string) =>
      onUpdate({
        ...value,
        disorders: structuredDisorders.filter((entry) => entry.id !== id),
      }),
    [value, structuredDisorders, onUpdate]
  );

  return (
    <div>
      <SectionHeader className="mb-2">Insanity</SectionHeader>
      <section className={`${sectionClassName} space-y-3`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs lg:text-sm text-slate-100 uppercase tracking-wide">Points</span>
            <Stepper value={value.points} editable={editable} onChange={handlePointsChange} />
          </div>
          <InsanityStatusChips points={value.points} />
        </div>

        <InsanityReferenceModals />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={uiFormLabel}>Disorders</span>
            {editable && (
              <button
                type="button"
                onClick={() => setShowDisorderPicker(true)}
                className={uiActionButtonCompact}
              >
                + Add
              </button>
            )}
          </div>

          {structuredDisorders.length > 0 ? (
            <div className="space-y-2">
              {structuredDisorders.map((disorder) => (
                <DisorderRow
                  key={disorder.id}
                  disorder={disorder}
                  editable={editable}
                  onRemove={() => handleRemoveDisorder(disorder.id)}
                />
              ))}
              {legacyDisorders.trim() && (
                <FormField
                  label="Disorder Notes"
                  value={legacyDisorders}
                  onChange={handleLegacyDisordersChange}
                  editable={editable}
                  type="textarea"
                  rows={2}
                  placeholder="Additional disorder notes..."
                />
              )}
            </div>
          ) : legacyDisorders.trim() ? (
            <FormField
              label="Legacy Disorder Notes"
              value={legacyDisorders}
              onChange={handleLegacyDisordersChange}
              editable={editable}
              type="textarea"
              rows={2}
              placeholder="List any disorders..."
            />
          ) : (
            <div className={`${uiCell} px-2 py-2`}>
              <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No disorders recorded.</p>
            </div>
          )}
        </div>
      </section>

      {showDisorderPicker && (
        <InsanityDisorderPicker
          onAdd={handleAddDisorder}
          onClose={() => setShowDisorderPicker(false)}
        />
      )}
    </div>
  );
}
