// src/features/insanity/InsanityPanel.tsx

import { useCallback, useMemo, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Stepper } from "../../components/Stepper";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import type {
  InsanityBlock,
  InsanityDisorderEntry,
  InsanityDisorderSeverity,
  InsanityTraumaEntry,
  TalentsAndTraitsBlock,
} from "../../types/Character";
import { getTalentInsanityModifierSources } from "../talents/talentEffects";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { RemoveButton } from "../../ui/RemoveButton";
import { RollChip } from "../../ui/RollChip";
import { colourActiveRose, colourActiveSky } from "../../ui/colourTokens";
import {
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/segmentedTabStyles";
import { InsanityDisorderPicker } from "./InsanityDisorderPicker";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import { InsanityTraumaPicker } from "./InsanityTraumaPicker";
import {
  getInsanityDisorderRef,
  getInsanityTrackEntry,
  getMentalTraumaRef,
  getNextInsanityDegreeEntry,
  getNextInsanityTrackEntry,
  INSANITY_RULE_TEXT,
  INSANITY_SEVERITIES,
} from "./insanityReference";
import {
  disorderTypeChipClass,
  INSANITY_TIMELINE_SEGMENTS,
  INSANITY_TIMELINE_TOTAL_WIDTH,
  insanityDegreeChipClass,
  insanityDisorderLevelChipClass,
  insanityDisorderLevelLabel,
  insanityStepperClass,
  severityChipClass,
} from "./insanityUi";

interface InsanityPanelProps {
  insanity?: InsanityBlock;
  editable: boolean;
  onUpdate: (next: InsanityBlock) => void;
  sectionClassName: string;
  talents?: TalentsAndTraitsBlock;
}

type EntryGroup = "trauma" | "disorders";
const ENTRY_GROUPS = ["trauma", "disorders"] as const satisfies readonly EntryGroup[];
const INSANITY_TABS = [
  {
    value: "trauma",
    label: "Temporary Trauma",
    activeClassName: colourActiveSky,
  },
  {
    value: "disorders",
    label: "Disorders",
    activeClassName: colourActiveRose,
  },
] as const satisfies readonly SegmentedTabOption<EntryGroup>[];
const INSANITY_TABS_ID = "insanity-entry-groups";

function severityDescription(severity: InsanityDisorderSeverity): string {
  return INSANITY_SEVERITIES.find((entry) => entry.severity === severity)?.description ?? "";
}

function InsanityTimeline({ points }: { points: number }) {
  const progressPct = Math.min(100, (points / INSANITY_TIMELINE_TOTAL_WIDTH) * 100);

  const breakpoints: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < INSANITY_TIMELINE_SEGMENTS.length - 1; i++) {
    cumulative += INSANITY_TIMELINE_SEGMENTS[i].width;
    breakpoints.push(cumulative);
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative h-2 rounded-full overflow-hidden border border-slate-600">
          <div className="absolute inset-0 flex">
            {INSANITY_TIMELINE_SEGMENTS.map((segment) => (
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
            {INSANITY_TIMELINE_SEGMENTS.map((segment) => (
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
            style={{ left: `${(value / INSANITY_TIMELINE_TOTAL_WIDTH) * 100}%` }}
          >
            {value}
          </span>
        ))}
        <span className="absolute left-full -translate-x-1/2">100</span>
      </div>
    </div>
  );
}

function InsanityStatusChips({ points }: { points: number }) {
  const safePoints = Math.max(0, Math.floor(points || 0));
  const entry = getInsanityTrackEntry(safePoints);
  const next = getNextInsanityTrackEntry(safePoints);
  const nextDegree = getNextInsanityDegreeEntry(safePoints);

  return (
    <div className="w-full max-w-md space-y-3">
      <InsanityTimeline points={safePoints} />

      <div className="flex justify-center items-center gap-1.5">
        <Chip size="lg" className={insanityDegreeChipClass(entry)}>{entry.degree}</Chip>
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title="Degree of Madness"
            content={
              <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                {INSANITY_RULE_TEXT.degree}
              </p>
            }
          />
        </span>
      </div>

      {entry.terminal ? (
        <p className="text-center text-xs lg:text-sm uppercase tracking-wide text-rose-300 pt-3 border-t border-slate-500">
          Character retires from play
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-500">
          <div className="flex flex-col items-center space-y-1.5">
            <span className={uiTextLabel}>Status</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Chip size="sm" className={insanityDegreeChipClass(entry)}>
                Trauma Modifier: {entry.traumaModifier}
              </Chip>
              <span className="inline-flex items-center gap-1">
                <Chip size="sm" className={insanityDisorderLevelChipClass(entry)}>
                  Disorder Level: {insanityDisorderLevelLabel(entry)}
                </Chip>
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title="Gaining Disorders"
                    content={
                      <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                        {INSANITY_RULE_TEXT.disorders}
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
              {next && (
                <p className="text-xs lg:text-sm text-slate-300 text-center">
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">{next.min - safePoints}</span> pt{next.min - safePoints === 1 ? "" : "s"} until Trauma Test{" "}
                  <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
                    <InfoModal
                      title="Mental Trauma"
                      content={
                        <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                          {INSANITY_RULE_TEXT.trauma}
                        </p>
                      }
                    />
                  </span>
                </p>
              )}
              {nextDegree && (
                <p className="text-xs lg:text-sm text-slate-300 text-center">
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">{nextDegree.min - safePoints}</span> pt{nextDegree.min - safePoints === 1 ? "" : "s"} until <span className="whitespace-nowrap">{nextDegree.degree}</span>
                </p>
              )}
            </div>
          </div>
        </div>
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

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={uiItemName}>{disorder.name}</span>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={disorderTypeChipClass(disorder.type)}>{disorder.type}</Chip>
            <span className="inline-flex items-center gap-1">
              <Chip size="sm" className={severityChipClass[disorder.severity]}>{disorder.severity}</Chip>
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
          <RemoveButton onClick={onRemove} label="Remove" />
        )}
      </div>
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
  const ref = getMentalTraumaRef(trauma.referenceId);
  const name = trauma.name ?? ref?.name ?? "Custom Trauma";
  const roll = ref?.roll ?? trauma.roll;
  const effect = ref?.effect ?? trauma.effect ?? trauma.notes ?? "Custom trauma.";

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={uiItemName}>{name}</span>
          {roll && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <RollChip>{roll}</RollChip>
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={name}
                content={<p className="text-sm leading-relaxed text-slate-300 lg:text-base">{effect}</p>}
              />
            </span>
          </div>
        </div>
        {editable && (
          <RemoveButton onClick={onRemove} label="Remove" />
        )}
      </div>
    </div>
  );
}

function TraumaHeader({
  editable,
  onAdd,
}: {
  editable: boolean;
  onAdd: () => void;
}) {
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
      {editable && (
        <Button size="xs" onClick={onAdd}>
          + Add
        </Button>
      )}
    </div>
  );
}

function TraumaList({
  trauma,
  editable,
  onRemove,
}: {
  trauma: InsanityTraumaEntry[];
  editable: boolean;
  onRemove: (id: string) => void;
}) {
  if (trauma.length === 0) {
    return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No temporary trauma recorded.</p>;
  }
  return (
    <div className="space-y-2">
      {[...trauma].sort((a, b) => traumaDisplayName(a).localeCompare(traumaDisplayName(b))).map((entry) => (
        <TraumaRow key={entry.id} trauma={entry} editable={editable} onRemove={() => onRemove(entry.id)} />
      ))}
    </div>
  );
}

function DisordersHeader({
  editable,
  onAdd,
}: {
  editable: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <SectionHeader>Disorders</SectionHeader>
      {editable && (
        <Button size="xs" onClick={onAdd}>
          + Add
        </Button>
      )}
    </div>
  );
}

function DisordersList({
  disorders,
  legacyDisorders,
  editable,
  onRemove,
  onLegacyChange,
}: {
  disorders: InsanityDisorderEntry[];
  legacyDisorders: string;
  editable: boolean;
  onRemove: (id: string) => void;
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

export function InsanityPanel({ insanity, editable, onUpdate, sectionClassName, talents }: InsanityPanelProps) {
  const value = useMemo(
    () => insanity ?? { points: 0, disorders: [] },
    [insanity]
  );
  const [showDisorderPicker, setShowDisorderPicker] = useState(false);
  const [showTraumaPicker, setShowTraumaPicker] = useState(false);
  const talentSources = talents ? getTalentInsanityModifierSources(talents) : [];
  const talentAdjustment = talentSources.reduce((total, source) => total + source.amount, 0);
  const effectivePoints = Math.min(100, Math.max(0, value.points + talentAdjustment));
  const structuredDisorders = useMemo(
    () => (Array.isArray(value.disorders) ? value.disorders : []),
    [value.disorders]
  );
  const existingDisorderReferenceIds = new Set(
    structuredDisorders.map((d) => d.referenceId).filter((id): id is string => Boolean(id))
  );
  const legacyDisorders = typeof value.disorders === "string" ? value.disorders : value.disorderNotes ?? "";
  const structuredTrauma = useMemo(
    () => value.currentTrauma ?? [],
    [value.currentTrauma]
  );
  const existingTraumaReferenceIds = new Set(
    structuredTrauma.map((t) => t.referenceId).filter((id): id is string => Boolean(id))
  );

  const [activeGroup, setActiveGroup] = useState<EntryGroup>(() =>
    structuredTrauma.length === 0 && structuredDisorders.length > 0 ? "disorders" : "trauma"
  );

  const handlePointsChange = useCallback(
    (points: number) => onUpdate({ ...value, points: Math.max(0, points - talentAdjustment) }),
    [value, onUpdate, talentAdjustment]
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

  const handleAddTrauma = useCallback(
    (entry: InsanityTraumaEntry) =>
      onUpdate({ ...value, currentTrauma: [...structuredTrauma, entry] }),
    [value, structuredTrauma, onUpdate]
  );

  const handleRemoveTrauma = useCallback(
    (id: string) =>
      onUpdate({
        ...value,
        currentTrauma: structuredTrauma.filter((entry) => entry.id !== id),
      }),
    [value, structuredTrauma, onUpdate]
  );

  const { containerRef, transitionClass, switchTo } = useSwipeableTabs(
    ENTRY_GROUPS,
    activeGroup,
    setActiveGroup
  );

  return (
    <div className="space-y-6">
      <div className={`${sectionClassName} flex flex-col items-center space-y-3`}>
        <div className="inline-flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className={uiFormLabel}>Points</span>
            {talentSources.length > 0 && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title="Insanity Point Adjustments"
                  content={
                    <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                      {talentSources.map((source, index) => (
                        <li key={index}>{source.name} (Talent): +{source.amount}</li>
                      ))}
                    </ul>
                  }
                />
              </span>
            )}
          </span>
          <Stepper
            value={effectivePoints}
            max={100}
            editable={editable}
            onChange={handlePointsChange}
            dangerClassName={insanityStepperClass(getInsanityTrackEntry(effectivePoints))}
          />
        </div>
        <InsanityStatusChips points={effectivePoints} />
      </div>

      {/* Mobile — tab switcher between Temporary Trauma and Disorders */}
      <div
        ref={containerRef}
        className="lg:hidden space-y-4"
      >
        <SegmentedTabs
          id={INSANITY_TABS_ID}
          ariaLabel="Insanity entry groups"
          options={INSANITY_TABS}
          value={activeGroup}
          onChange={switchTo}
        />

        <section
          key={activeGroup}
          id={segmentedTabPanelId(INSANITY_TABS_ID, activeGroup)}
          aria-labelledby={segmentedTabId(INSANITY_TABS_ID, activeGroup)}
          className={["space-y-2", uiSwipeableTabPanel, transitionClass].join(" ")}
          role="tabpanel"
        >
          {activeGroup === "trauma" ? (
            <>
              <TraumaHeader editable={editable} onAdd={() => setShowTraumaPicker(true)} />
              <TraumaList trauma={structuredTrauma} editable={editable} onRemove={handleRemoveTrauma} />
            </>
          ) : (
            <>
              <DisordersHeader editable={editable} onAdd={() => setShowDisorderPicker(true)} />
              <DisordersList
                disorders={structuredDisorders}
                legacyDisorders={legacyDisorders}
                editable={editable}
                onRemove={handleRemoveDisorder}
                onLegacyChange={handleLegacyDisordersChange}
              />
            </>
          )}
        </section>
      </div>

      {/* Desktop — side by side */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <section className={`${sectionClassName} space-y-2`}>
          <TraumaHeader editable={editable} onAdd={() => setShowTraumaPicker(true)} />
          <TraumaList trauma={structuredTrauma} editable={editable} onRemove={handleRemoveTrauma} />
        </section>

        <section className={`${sectionClassName} space-y-2`}>
          <DisordersHeader editable={editable} onAdd={() => setShowDisorderPicker(true)} />
          <DisordersList
            disorders={structuredDisorders}
            legacyDisorders={legacyDisorders}
            editable={editable}
            onRemove={handleRemoveDisorder}
            onLegacyChange={handleLegacyDisordersChange}
          />
        </section>
      </div>

      {showDisorderPicker && (
        <InsanityDisorderPicker
          existingReferenceIds={existingDisorderReferenceIds}
          onAdd={handleAddDisorder}
          onClose={() => setShowDisorderPicker(false)}
        />
      )}

      {showTraumaPicker && (
        <InsanityTraumaPicker
          existingReferenceIds={existingTraumaReferenceIds}
          onAdd={handleAddTrauma}
          onClose={() => setShowTraumaPicker(false)}
        />
      )}
    </div>
  );
}
