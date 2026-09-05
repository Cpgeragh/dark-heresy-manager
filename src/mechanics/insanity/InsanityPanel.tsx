// src/mechanics/insanity/InsanityPanel.tsx

import { useCallback, useMemo, useState } from "react";
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
import { getTraitInsanityModifierSources } from "../traits/traitEffects";
import { Chip } from "../../ui/chips/Chip";
import { colourActiveRose, colourActiveSky } from "../../ui/styles/colourTokens";
import { uiFormLabel, uiInfoModalWrapper, uiTextLabel } from "../../ui/styles/editableStyles";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import { SegmentedTimeline } from "../../ui/SegmentedTimeline";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/styles/segmentedTabStyles";
import { InsanityDisorderPicker } from "./InsanityDisorderPicker";
import { DisordersHeader, DisordersList, TraumaHeader, TraumaList } from "./InsanityEntryLists";
import { InsanityTraumaPicker } from "./InsanityTraumaPicker";
import {
  getInsanityTrackEntry,
  getNextInsanityDegreeEntry,
  getNextInsanityTrackEntry,
  INSANITY_RULE_TEXT,
} from "./insanityReference";
import {
  INSANITY_TIMELINE_SEGMENTS,
  INSANITY_TIMELINE_TOTAL_WIDTH,
  insanityDegreeChipClass,
  insanityDisorderLevelChipClass,
  insanityDisorderLevelLabel,
  insanityStepperClass,
} from "./insanityUi";

interface InsanityPanelProps {
  insanity?: InsanityBlock;
  editable: boolean;
  onUpdate: (next: InsanityBlock) => void;
  sectionClassName: string;
  talents?: TalentsAndTraitsBlock;
  career?: string;
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

function InsanityStatusChips({ points }: { points: number }) {
  const safePoints = Math.max(0, Math.floor(points || 0));
  const entry = getInsanityTrackEntry(safePoints);
  const next = getNextInsanityTrackEntry(safePoints);
  const nextDegree = getNextInsanityDegreeEntry(safePoints);

  return (
    <div className="w-full max-w-md space-y-3">
      <SegmentedTimeline
        value={safePoints}
        segments={INSANITY_TIMELINE_SEGMENTS}
        totalWidth={INSANITY_TIMELINE_TOTAL_WIDTH}
      />

      <div className="flex justify-center items-center gap-1.5">
        <Chip size="lg" className={insanityDegreeChipClass(entry)}>
          {entry.degree}
        </Chip>
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
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">
                    {next.min - safePoints}
                  </span>{" "}
                  pt{next.min - safePoints === 1 ? "" : "s"} until Trauma Test{" "}
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
                  <span className="font-code text-sm lg:text-base font-bold text-amber-400">
                    {nextDegree.min - safePoints}
                  </span>{" "}
                  pt{nextDegree.min - safePoints === 1 ? "" : "s"} until{" "}
                  <span className="whitespace-nowrap">{nextDegree.degree}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function InsanityPanel({
  insanity,
  editable,
  onUpdate,
  sectionClassName,
  talents,
  career,
}: InsanityPanelProps) {
  const value = useMemo(() => insanity ?? { points: 0, disorders: [] }, [insanity]);
  const [showDisorderPicker, setShowDisorderPicker] = useState(false);
  const [showTraumaPicker, setShowTraumaPicker] = useState(false);
  const recordedSources = talents
    ? [
        ...getTalentInsanityModifierSources(talents),
        ...getTraitInsanityModifierSources(talents, career),
      ]
    : [];
  const recordedAdjustment = recordedSources.reduce((total, source) => total + source.amount, 0);
  const effectivePoints = Math.min(100, Math.max(0, value.points + recordedAdjustment));
  const structuredDisorders = useMemo(
    () => (Array.isArray(value.disorders) ? value.disorders : []),
    [value.disorders]
  );
  const existingDisorderReferenceIds = new Set(
    structuredDisorders.map((d) => d.referenceId).filter((id): id is string => Boolean(id))
  );
  const legacyDisorders =
    typeof value.disorders === "string" ? value.disorders : (value.disorderNotes ?? "");
  const structuredTrauma = useMemo(() => value.currentTrauma ?? [], [value.currentTrauma]);
  const existingTraumaReferenceIds = new Set(
    structuredTrauma.map((t) => t.referenceId).filter((id): id is string => Boolean(id))
  );

  const [activeGroup, setActiveGroup] = useState<EntryGroup>(() =>
    structuredTrauma.length === 0 && structuredDisorders.length > 0 ? "disorders" : "trauma"
  );

  const handlePointsChange = useCallback(
    (points: number) => onUpdate({ ...value, points: Math.max(0, points - recordedAdjustment) }),
    [value, onUpdate, recordedAdjustment]
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

  const handleEscalateDisorder = useCallback(
    (id: string, severity: InsanityDisorderSeverity) =>
      onUpdate({
        ...value,
        disorders: structuredDisorders.map((entry) =>
          entry.id === id ? { ...entry, severity } : entry
        ),
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
            {recordedSources.length > 0 && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title="Insanity Point Adjustments"
                  content={
                    <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                      {recordedSources.map((source, index) => (
                        <li key={index}>
                          {source.name} ({source.type}): +{source.amount}
                        </li>
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
      <div ref={containerRef} className="lg:hidden space-y-4">
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
              <TraumaList
                trauma={structuredTrauma}
                editable={editable}
                onRemove={handleRemoveTrauma}
              />
            </>
          ) : (
            <>
              <DisordersHeader editable={editable} onAdd={() => setShowDisorderPicker(true)} />
              <DisordersList
                disorders={structuredDisorders}
                legacyDisorders={legacyDisorders}
                editable={editable}
                onRemove={handleRemoveDisorder}
                onEscalate={handleEscalateDisorder}
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
            onEscalate={handleEscalateDisorder}
            onLegacyChange={handleLegacyDisordersChange}
          />
        </section>
      </div>

      {showDisorderPicker && (
        <InsanityDisorderPicker
          existingReferenceIds={existingDisorderReferenceIds}
          editable={editable}
          onAdd={handleAddDisorder}
          onClose={() => setShowDisorderPicker(false)}
        />
      )}

      {showTraumaPicker && (
        <InsanityTraumaPicker
          existingReferenceIds={existingTraumaReferenceIds}
          editable={editable}
          onAdd={handleAddTrauma}
          onClose={() => setShowTraumaPicker(false)}
        />
      )}
    </div>
  );
}
