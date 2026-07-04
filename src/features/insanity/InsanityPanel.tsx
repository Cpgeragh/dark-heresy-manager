// src/features/insanity/InsanityPanel.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Stepper } from "../../components/Stepper";
import type {
  InsanityBlock,
  InsanityDisorderEntry,
  InsanityDisorderSeverity,
  InsanityTraumaEntry,
} from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import { colourActiveRose, colourActiveSky, colourAmberFaint } from "../../ui/colourTokens";
import {
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
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
}

type EntryGroup = "trauma" | "disorders";

function severityDescription(severity: InsanityDisorderSeverity): string {
  return INSANITY_SEVERITIES.find((entry) => entry.severity === severity)?.description ?? "";
}

function InsanityTimeline({ points }: { points: number }) {
  const progressPct = Math.min(100, (points / INSANITY_TIMELINE_TOTAL_WIDTH) * 100);

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

      <div className="flex justify-center">
        <Chip size="lg" className={insanityDegreeChipClass(entry)}>{entry.degree}</Chip>
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
              <Chip size="sm" className={insanityDisorderLevelChipClass(entry)}>
                Disorder Level: {insanityDisorderLevelLabel(entry)}
              </Chip>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-1.5 border-l border-slate-500 pl-3">
            <span className={uiTextLabel}>Thresholds</span>
            <div className="flex flex-col items-center gap-1">
              {next && (
                <p className="text-xs lg:text-sm text-slate-300 text-center">
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">{next.min - safePoints}</span> pt{next.min - safePoints === 1 ? "" : "s"} until Trauma Test
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
                    hideName
                  />
                }
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
              <Chip size="sm" className={colourAmberFaint}>{roll}</Chip>
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
          <button type="button" onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
            Remove
          </button>
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
        <button type="button" onClick={onAdd} className={uiActionButtonCompact}>
          + Add
        </button>
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
        <button type="button" onClick={onAdd} className={uiActionButtonCompact}>
          + Add
        </button>
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

export function InsanityPanel({ insanity, editable, onUpdate, sectionClassName }: InsanityPanelProps) {
  const value = insanity ?? { points: 0, disorders: [] };
  const [showDisorderPicker, setShowDisorderPicker] = useState(false);
  const [showTraumaPicker, setShowTraumaPicker] = useState(false);
  const structuredDisorders = Array.isArray(value.disorders) ? value.disorders : [];
  const existingDisorderReferenceIds = new Set(
    structuredDisorders.map((d) => d.referenceId).filter((id): id is string => Boolean(id))
  );
  const legacyDisorders = typeof value.disorders === "string" ? value.disorders : value.disorderNotes ?? "";
  const structuredTrauma = value.currentTrauma ?? [];
  const existingTraumaReferenceIds = new Set(
    structuredTrauma.map((t) => t.referenceId).filter((id): id is string => Boolean(id))
  );

  const [activeGroup, setActiveGroup] = useState<EntryGroup>(() =>
    structuredTrauma.length === 0 && structuredDisorders.length > 0 ? "disorders" : "trauma"
  );
  const [groupTransition, setGroupTransition] = useState<"idle" | "sliding">("idle");
  const swipeContainerRef = useRef<HTMLDivElement>(null);

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

  const switchGroup = useCallback((group?: EntryGroup) => {
    setActiveGroup((current) => {
      const next = group ?? (current === "trauma" ? "disorders" : "trauma");
      if (next === current) return current;
      setGroupTransition("sliding");
      window.setTimeout(() => setGroupTransition("idle"), 180);
      return next;
    });
  }, []);
  useEffect(() => {
    const element = swipeContainerRef.current;
    if (!element) return;

    let startX = NaN;
    let startY = 0;
    let isHorizontal: boolean | null = null;

    const onTouchStart = (event: globalThis.TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, [role='button']")) {
        startX = NaN;
        isHorizontal = null;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      const rect = element.getBoundingClientRect();
      if (touch.clientY < rect.top || touch.clientY > rect.bottom) {
        startX = NaN;
        return;
      }
      startX = touch.clientX;
      startY = touch.clientY;
      isHorizontal = null;
    };

    const onTouchMove = (event: globalThis.TouchEvent) => {
      if (isNaN(startX)) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (isHorizontal === null) {
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;
        isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      }
      if (isHorizontal) event.preventDefault();
    };

    const onTouchEnd = (event: globalThis.TouchEvent) => {
      const wasHorizontal = isHorizontal;
      const start = startX;
      startX = NaN;
      isHorizontal = null;
      if (isNaN(start) || !wasHorizontal) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      if (Math.abs(touch.clientX - start) < 50) return;
      switchGroup();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [switchGroup]);

  const transitionClass =
    groupTransition === "sliding"
      ? activeGroup === "trauma"
        ? "opacity-0 -translate-x-3"
        : "opacity-0 translate-x-3"
      : "opacity-100";

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
            dangerClassName={insanityStepperClass(getInsanityTrackEntry(value.points))}
          />
        </div>
        <InsanityStatusChips points={value.points} />
      </div>

      {/* Mobile — tab switcher between Temporary Trauma and Disorders */}
      <div
        ref={swipeContainerRef}
        className="lg:hidden space-y-4"
      >
        <div
          className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Insanity entry groups"
        >
          {(["trauma", "disorders"] as const).map((group) => {
            const active = activeGroup === group;
            return (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchGroup(group)}
                className={[
                  "rounded-md px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border",
                  active
                    ? (group === "trauma" ? colourActiveSky : colourActiveRose)
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {group === "trauma" ? "Temporary Trauma" : "Disorders"}
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
