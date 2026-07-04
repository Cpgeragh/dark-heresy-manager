// src/features/corruption/CorruptionPanel.tsx

import { useCallback, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Stepper } from "../../components/Stepper";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import type { CorruptionBlock, CorruptionMalignancyEntry, CorruptionMutationEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import {
  colourActiveEmerald,
  colourActiveOrange,
  colourActiveSky,
  colourAmberFaint,
  colourRose,
  colourSky,
} from "../../ui/colourTokens";
import {
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { getRollDisplayEntries } from "./characteristicModifiers";
import { CorruptionMalignancyPicker } from "./CorruptionMalignancyPicker";
import { MalignancyInfoContent } from "./CorruptionReferenceModals";
import { MutationPicker } from "./MutationPicker";
import { mutationDisplayName, MutationRow } from "./MutationRow";
import { RollEditor } from "./RollEditor";
import {
  CORRUPTION_RULE_TEXT,
  getCorruptionMalignancyRef,
  getCorruptionTrackEntry,
  getNextCorruptionTrackEntry,
  getNextMalignancyTestPoints,
} from "./corruptionReference";
import {
  CORRUPTION_TIMELINE_SEGMENTS,
  CORRUPTION_TIMELINE_TOTAL_WIDTH,
  corruptionDegreeChipClass,
  corruptionMutationLevelLabel,
  corruptionStepperClass,
} from "./corruptionUi";

interface CorruptionPanelProps {
  corruption?: CorruptionBlock;
  editable: boolean;
  onUpdate: (next: CorruptionBlock) => void;
  sectionClassName: string;
}

type EntryGroup = "malignancies" | "minorMutations" | "majorMutations";
const ENTRY_GROUPS = ["malignancies", "minorMutations", "majorMutations"] as const satisfies readonly EntryGroup[];

const GROUP_LABELS: Record<EntryGroup, string> = {
  malignancies: "Malignancies",
  minorMutations: "Minor Mutations",
  majorMutations: "Major Mutations",
};

const GROUP_ACTIVE_CLASS: Record<EntryGroup, string> = {
  malignancies: colourActiveSky,
  minorMutations: colourActiveEmerald,
  majorMutations: colourActiveOrange,
};

function CorruptionTimeline({ points }: { points: number }) {
  const progressPct = Math.min(100, (points / CORRUPTION_TIMELINE_TOTAL_WIDTH) * 100);

  const breakpoints: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < CORRUPTION_TIMELINE_SEGMENTS.length - 1; i++) {
    cumulative += CORRUPTION_TIMELINE_SEGMENTS[i].width;
    breakpoints.push(cumulative);
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative h-2 rounded-full overflow-hidden border border-slate-600">
          <div className="absolute inset-0 flex">
            {CORRUPTION_TIMELINE_SEGMENTS.map((segment) => (
              <div
                key={segment.degree}
                className={segment.dimColourClass}
                style={{ flexGrow: segment.width, flexBasis: 0, flexShrink: 0 }}
              />
            ))}
          </div>
          <div
            className="absolute inset-0 flex"
            style={{ clipPath: `inset(0 ${100 - progressPct}% 0 0)` }}
          >
            {CORRUPTION_TIMELINE_SEGMENTS.map((segment) => (
              <div
                key={segment.degree}
                className={segment.colourClass}
                style={{ flexGrow: segment.width, flexBasis: 0, flexShrink: 0 }}
              />
            ))}
          </div>
        </div>
        <div
          className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-slate-100"
          style={{ left: `${progressPct}%` }}
        />
      </div>
      <div className="relative h-4 mt-1.5 text-xs lg:text-sm font-semibold text-slate-200">
        <span className="absolute left-0 -translate-x-1/2">0</span>
        {breakpoints.map((value) => (
          <span
            key={value}
            className="absolute -translate-x-1/2 text-[10px] lg:text-xs font-normal text-slate-300"
            style={{ left: `${(value / CORRUPTION_TIMELINE_TOTAL_WIDTH) * 100}%` }}
          >
            {value}
          </span>
        ))}
        <span className="absolute left-full -translate-x-1/2">100</span>
      </div>
    </div>
  );
}

function CorruptionStatusChips({ points }: { points: number }) {
  const safePoints = Math.max(0, Math.floor(points || 0));
  const entry = getCorruptionTrackEntry(safePoints);
  const nextDegree = getNextCorruptionTrackEntry(safePoints);
  const nextMalignancyTest = getNextMalignancyTestPoints(safePoints);

  return (
    <div className="w-full max-w-md space-y-3">
      <CorruptionTimeline points={safePoints} />

      <div className="flex justify-center items-center gap-1.5">
        <Chip size="lg" className={corruptionDegreeChipClass(entry)}>{entry.degree}</Chip>
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title="Degree of Corruption"
            content={
              <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                {CORRUPTION_RULE_TEXT.degree}
              </p>
            }
          />
        </span>
      </div>

      {entry.terminal ? (
        <p className="text-center text-xs lg:text-sm uppercase tracking-wide text-rose-300 pt-3 border-t border-slate-500">
          Character removed from play
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-500">
          <div className="flex flex-col items-center space-y-1.5">
            <span className={uiTextLabel}>Status</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Chip size="sm" className={corruptionDegreeChipClass(entry)}>
                Malignancy Test Modifier: {entry.malignancyModifier}
              </Chip>
              <span className="inline-flex items-center gap-1">
                <Chip size="sm" className={corruptionDegreeChipClass(entry)}>
                  Mutation Level: {corruptionMutationLevelLabel(entry)}
                </Chip>
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title="Mutation"
                    content={
                      <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                        {CORRUPTION_RULE_TEXT.mutation}
                      </p>
                    }
                  />
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-1.5 border-l border-slate-500 pl-3">
            <span className={uiTextLabel}>Thresholds</span>
            <div className="flex flex-col items-center gap-1">
              {nextMalignancyTest !== undefined && (
                <p className="text-xs lg:text-sm text-slate-300 text-center">
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">
                    {nextMalignancyTest - safePoints}
                  </span>{" "}
                  pt{nextMalignancyTest - safePoints === 1 ? "" : "s"} until Malignancy Test{" "}
                  <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
                    <InfoModal
                      title="The Malignancy Test"
                      content={
                        <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                          {CORRUPTION_RULE_TEXT.malignancyTest}
                        </p>
                      }
                    />
                  </span>
                </p>
              )}
              {nextDegree && (
                <p className="text-xs lg:text-sm text-slate-300 text-center">
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">
                    {nextDegree.min - safePoints}
                  </span>{" "}
                  pt{nextDegree.min - safePoints === 1 ? "" : "s"} until {nextDegree.degree}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupHeader({ label, editable, onAdd }: { label: string; editable: boolean; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <SectionHeader>{label}</SectionHeader>
      {editable && (
        <button type="button" onClick={onAdd} className={uiActionButtonCompact}>
          + Add
        </button>
      )}
    </div>
  );
}

function malignancyDisplayName(malignancy: CorruptionMalignancyEntry): string {
  return getCorruptionMalignancyRef(malignancy.referenceId)?.name ?? malignancy.name ?? "";
}

export function MalignancyRow({
  malignancy,
  editable,
  onRemove,
  onUpdateRolls,
}: {
  malignancy: CorruptionMalignancyEntry;
  editable: boolean;
  onRemove: () => void;
  onUpdateRolls: (rolledModifiers: Record<string, number>) => void;
}) {
  const [isEditingRolls, setIsEditingRolls] = useState(false);
  const ref = getCorruptionMalignancyRef(malignancy.referenceId);
  const display = {
    roll: ref?.roll ?? malignancy.roll,
    name: ref?.name ?? malignancy.name,
    effect: ref?.effect ?? malignancy.effect,
  };
  const rollEntries = getRollDisplayEntries(ref?.modifiers, malignancy.rolledModifiers);

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={uiItemName}>{display.name}</span>
          {display.roll && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip size="sm" className={colourAmberFaint}>{display.roll}</Chip>
            </div>
          )}
          {rollEntries.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {rollEntries.map((entry) => (
                <Chip key={entry.characteristic} size="sm" className={entry.value === undefined ? colourRose : colourSky}>
                  {entry.label}: {entry.value ?? "not recorded"}
                </Chip>
              ))}
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
          <div className="flex shrink-0 gap-1.5">
            {rollEntries.length > 0 && (
              <button type="button" onClick={() => setIsEditingRolls(true)} className={uiActionButtonCompact}>
                Edit Rolls
              </button>
            )}
            <button type="button" onClick={onRemove} className={uiActionButtonCompact}>
              Remove
            </button>
          </div>
        )}
      </div>
      {isEditingRolls && (
        <RollEditor
          title={display.name}
          modifiers={ref?.modifiers ?? []}
          initialRolledModifiers={malignancy.rolledModifiers}
          onSave={(rolledModifiers) => {
            onUpdateRolls(rolledModifiers);
            setIsEditingRolls(false);
          }}
          onCancel={() => setIsEditingRolls(false)}
        />
      )}
    </div>
  );
}

function MalignanciesList({
  malignancies,
  legacyMalignancies,
  editable,
  onRemove,
  onUpdateRolls,
  onLegacyChange,
}: {
  malignancies: CorruptionMalignancyEntry[];
  legacyMalignancies: string;
  editable: boolean;
  onRemove: (id: string) => void;
  onUpdateRolls: (id: string, rolledModifiers: Record<string, number>) => void;
  onLegacyChange: (notes: string) => void;
}) {
  if (malignancies.length > 0) {
    return (
      <div className="space-y-2">
        {[...malignancies]
          .sort((a, b) => malignancyDisplayName(a).localeCompare(malignancyDisplayName(b)))
          .map((malignancy) => (
            <MalignancyRow
              key={malignancy.id}
              malignancy={malignancy}
              editable={editable}
              onRemove={() => onRemove(malignancy.id)}
              onUpdateRolls={(rolledModifiers) => onUpdateRolls(malignancy.id, rolledModifiers)}
            />
          ))}
        {legacyMalignancies.trim() && (
          <FormField
            label="Malignancy Notes"
            value={legacyMalignancies}
            onChange={onLegacyChange}
            editable={editable}
            type="textarea"
            rows={2}
            placeholder="Additional malignancy notes..."
          />
        )}
      </div>
    );
  }

  if (legacyMalignancies.trim()) {
    return (
      <FormField
        label="Legacy Malignancy Notes"
        value={legacyMalignancies}
        onChange={onLegacyChange}
        editable={editable}
        type="textarea"
        rows={2}
        placeholder="List any malignancies..."
      />
    );
  }

  return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No malignancies recorded.</p>;
}

function MutationsList({
  mutations,
  editable,
  onRemove,
  onUpdateRolls,
  emptyLabel,
}: {
  mutations: CorruptionMutationEntry[];
  editable: boolean;
  onRemove: (id: string) => void;
  onUpdateRolls: (id: string, rolledModifiers: Record<string, number>) => void;
  emptyLabel: string;
}) {
  if (mutations.length === 0) {
    return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>{emptyLabel}</p>;
  }
  return (
    <div className="space-y-2">
      {[...mutations]
        .sort((a, b) => mutationDisplayName(a).localeCompare(mutationDisplayName(b)))
        .map((mutation) => (
          <MutationRow
            key={mutation.id}
            mutation={mutation}
            editable={editable}
            onRemove={() => onRemove(mutation.id)}
            onUpdateRolls={(rolledModifiers) => onUpdateRolls(mutation.id, rolledModifiers)}
          />
        ))}
    </div>
  );
}

export function CorruptionPanel({ corruption, editable, onUpdate, sectionClassName }: CorruptionPanelProps) {
  const value = corruption ?? { points: 0, malignancies: [] };
  const [showMalignancyPicker, setShowMalignancyPicker] = useState(false);
  const [showMinorMutationPicker, setShowMinorMutationPicker] = useState(false);
  const [showMajorMutationPicker, setShowMajorMutationPicker] = useState(false);

  const structuredMalignancies = Array.isArray(value.malignancies) ? value.malignancies : [];
  const legacyMalignancies = typeof value.malignancies === "string" ? value.malignancies : value.malignancyNotes ?? "";
  const existingMalignancyReferenceIds = new Set(
    structuredMalignancies.map((m) => m.referenceId).filter((id): id is string => Boolean(id))
  );

  const minorMutations = value.minorMutations ?? [];
  const existingMinorMutationReferenceIds = new Set(
    minorMutations.map((m) => m.referenceId).filter((id): id is string => Boolean(id))
  );
  const majorMutations = value.majorMutations ?? [];
  const existingMajorMutationReferenceIds = new Set(
    majorMutations.map((m) => m.referenceId).filter((id): id is string => Boolean(id))
  );

  const [activeGroup, setActiveGroup] = useState<EntryGroup>(() => {
    if (structuredMalignancies.length > 0) return "malignancies";
    if (minorMutations.length > 0) return "minorMutations";
    if (majorMutations.length > 0) return "majorMutations";
    return "malignancies";
  });

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

  const handleUpdateMalignancyRolls = useCallback(
    (id: string, rolledModifiers: Record<string, number>) =>
      onUpdate({
        ...value,
        malignancies: structuredMalignancies.map((entry) =>
          entry.id === id ? { ...entry, rolledModifiers } : entry
        ),
      }),
    [value, structuredMalignancies, onUpdate]
  );

  const handleAddMinorMutation = useCallback(
    (entry: CorruptionMutationEntry) => onUpdate({ ...value, minorMutations: [...minorMutations, entry] }),
    [value, minorMutations, onUpdate]
  );

  const handleRemoveMinorMutation = useCallback(
    (id: string) => onUpdate({ ...value, minorMutations: minorMutations.filter((entry) => entry.id !== id) }),
    [value, minorMutations, onUpdate]
  );

  const handleUpdateMinorMutationRolls = useCallback(
    (id: string, rolledModifiers: Record<string, number>) =>
      onUpdate({
        ...value,
        minorMutations: minorMutations.map((entry) => (entry.id === id ? { ...entry, rolledModifiers } : entry)),
      }),
    [value, minorMutations, onUpdate]
  );

  const handleAddMajorMutation = useCallback(
    (entry: CorruptionMutationEntry) => onUpdate({ ...value, majorMutations: [...majorMutations, entry] }),
    [value, majorMutations, onUpdate]
  );

  const handleRemoveMajorMutation = useCallback(
    (id: string) => onUpdate({ ...value, majorMutations: majorMutations.filter((entry) => entry.id !== id) }),
    [value, majorMutations, onUpdate]
  );

  const handleUpdateMajorMutationRolls = useCallback(
    (id: string, rolledModifiers: Record<string, number>) =>
      onUpdate({
        ...value,
        majorMutations: majorMutations.map((entry) => (entry.id === id ? { ...entry, rolledModifiers } : entry)),
      }),
    [value, majorMutations, onUpdate]
  );

  const { containerRef, transition, switchTo } = useSwipeableTabs(ENTRY_GROUPS, activeGroup, setActiveGroup);

  const groupIndex = ENTRY_GROUPS.indexOf(activeGroup);
  const transitionClass =
    transition === "sliding"
      ? groupIndex === 0
        ? "opacity-0 -translate-x-3"
        : groupIndex === ENTRY_GROUPS.length - 1
          ? "opacity-0 translate-x-3"
          : "opacity-0"
      : "opacity-100";

  function renderGroup(group: EntryGroup) {
    if (group === "malignancies") {
      return (
        <>
          <GroupHeader label="Malignancies" editable={editable} onAdd={() => setShowMalignancyPicker(true)} />
          <MalignanciesList
            malignancies={structuredMalignancies}
            legacyMalignancies={legacyMalignancies}
            editable={editable}
            onRemove={handleRemoveMalignancy}
            onUpdateRolls={handleUpdateMalignancyRolls}
            onLegacyChange={handleLegacyMalignanciesChange}
          />
        </>
      );
    }
    if (group === "minorMutations") {
      return (
        <>
          <GroupHeader label="Minor Mutations" editable={editable} onAdd={() => setShowMinorMutationPicker(true)} />
          <MutationsList
            mutations={minorMutations}
            editable={editable}
            onRemove={handleRemoveMinorMutation}
            onUpdateRolls={handleUpdateMinorMutationRolls}
            emptyLabel="No minor mutations recorded."
          />
        </>
      );
    }
    return (
      <>
        <GroupHeader label="Major Mutations" editable={editable} onAdd={() => setShowMajorMutationPicker(true)} />
        <MutationsList
          mutations={majorMutations}
          editable={editable}
          onRemove={handleRemoveMajorMutation}
          onUpdateRolls={handleUpdateMajorMutationRolls}
          emptyLabel="No major mutations recorded."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${sectionClassName} flex flex-col items-center space-y-3`}>
        <div className="inline-flex flex-col items-center gap-2">
          <span className={uiFormLabel}>Points</span>
          <Stepper
            value={value.points}
            max={100}
            editable={editable}
            onChange={handlePointsChange}
            dangerClassName={corruptionStepperClass(getCorruptionTrackEntry(value.points))}
          />
        </div>
        <CorruptionStatusChips points={value.points} />
      </div>

      {/* Mobile — tab switcher between Malignancies / Minor Mutations / Major Mutations */}
      <div ref={containerRef} className="lg:hidden space-y-4">
        <div
          className="grid grid-cols-3 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Corruption entry groups"
        >
          {ENTRY_GROUPS.map((group) => {
            const active = activeGroup === group;
            return (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTo(group)}
                className={[
                  "rounded-md px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border",
                  active ? GROUP_ACTIVE_CLASS[group] : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {GROUP_LABELS[group]}
              </button>
            );
          })}
        </div>

        <section
          key={activeGroup}
          className={[
            "space-y-2 min-h-[45vh] lg:min-h-0 transition-all duration-150 ease-out motion-reduce:transition-none",
            transitionClass,
          ].join(" ")}
          role="tabpanel"
        >
          {renderGroup(activeGroup)}
        </section>
      </div>

      {/* Desktop — side by side */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
        <section className={`${sectionClassName} space-y-2`}>{renderGroup("malignancies")}</section>
        <section className={`${sectionClassName} space-y-2`}>{renderGroup("minorMutations")}</section>
        <section className={`${sectionClassName} space-y-2`}>{renderGroup("majorMutations")}</section>
      </div>

      {showMalignancyPicker && (
        <CorruptionMalignancyPicker
          existingReferenceIds={existingMalignancyReferenceIds}
          onAdd={handleAddMalignancy}
          onClose={() => setShowMalignancyPicker(false)}
        />
      )}
      {showMinorMutationPicker && (
        <MutationPicker
          tier="minor"
          existingReferenceIds={existingMinorMutationReferenceIds}
          onAdd={handleAddMinorMutation}
          onClose={() => setShowMinorMutationPicker(false)}
        />
      )}
      {showMajorMutationPicker && (
        <MutationPicker
          tier="major"
          existingReferenceIds={existingMajorMutationReferenceIds}
          onAdd={handleAddMajorMutation}
          onClose={() => setShowMajorMutationPicker(false)}
        />
      )}
    </div>
  );
}
