// src/pages/characterSheet/PsychicTab.tsx

import { useState, useCallback } from "react";
import type { PsychicBlock, PsychicPower } from "../../types/Character";
import {
  PSYCHIC_POWER_REFERENCE,
  PSYCHIC_DISCIPLINES,
  type PsychicPowerRef,
  type PsychicDiscipline,
} from "../../data/reference/psychicReference";
import {
  sectionContainerClass,
  uiSectionHeader,
} from "../../ui/editableStyles";
import { PowerCard } from "./components/PowerCard";
import { PickerModal } from "../../ui/PickerModal";
import { InfoModal } from "../../components/InfoModal";
import { usePsychicPowers } from "../../hooks/usePsychicPowers";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PsychicTabProps {
  psychic: PsychicBlock;
  psyRating: number;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

type PickerTarget = "minor" | "major" | null;
type DisciplineFilter = PsychicDiscipline | "All";

// ─── Sub-component: Power Picker Modal ───────────────────────────────────────

function PowerPicker({
  initialDiscipline,
  excludeMinor = false,
  minorOnly = false,
  editable = true,
  existingNames,
  onSelect,
  onCustomMinor,
  onCustomMajor,
  onClose,
}: {
  initialDiscipline: DisciplineFilter;
  excludeMinor?: boolean;
  minorOnly?: boolean;
  editable?: boolean;
  existingNames: Set<string>;
  onSelect: (ref: PsychicPowerRef) => void;
  onCustomMinor: () => void;
  onCustomMajor: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineFilter>(initialDiscipline);

  const filtered = PSYCHIC_POWER_REFERENCE.filter((r) => {
    const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase());
    const matchesDiscipline = discipline === "All" || r.discipline === discipline;
    const notMinor = !excludeMinor || r.discipline !== "Minor";
    const onlyMinor = !minorOnly || r.discipline === "Minor";
    const notAlreadyPicked = !existingNames.has(r.name);
    return matchesQuery && matchesDiscipline && notMinor && onlyMinor && notAlreadyPicked;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const allFilters: DisciplineFilter[] = [
    ...(!minorOnly ? (["All"] as DisciplineFilter[]) : []),
    ...PSYCHIC_DISCIPLINES.filter((d) => {
      if (excludeMinor && d === "Minor") return false;
      if (minorOnly && d !== "Minor") return false;
      return true;
    }),
  ];

  return (
    <PickerModal
      title="Add Psychic Power"
      placeholder="Search powers…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      maxHeight="max-h-[85vh]"
      filterRow={allFilters.map((d) => (
        <button
          key={d}
          onClick={() => setDiscipline(d)}
          className={[
            "text-xs px-2.5 py-0.5 rounded border transition",
            discipline === d
              ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
              : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
          ].join(" ")}
        >
          {d}
        </button>
      ))}
      footer={editable ? (
        <div className="flex gap-2">
          <button
            onClick={onCustomMinor}
            className="flex-1 text-sm text-amber-400 hover:text-amber-300 text-center py-1 transition"
          >
            + Custom minor power
          </button>
          <div className="w-px bg-slate-700 self-stretch" />
          <button
            onClick={onCustomMajor}
            className="flex-1 text-sm text-amber-400 hover:text-amber-300 text-center py-1 transition"
          >
            + Custom major power
          </button>
        </div>
      ) : undefined}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                {ref.name}
              </span>
              {ref.description && (
                <span className="inline-flex items-center leading-[0]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={ref.name}
                    content={<p className="text-sm text-slate-300 leading-relaxed">{ref.description}</p>}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 flex-wrap justify-end">
              <span className="text-indigo-400/80">{ref.discipline}</span>
              <span className="font-mono">PT {ref.threshold}</span>
              <span>{ref.focusTime}</span>
              <span>{ref.range}</span>
              {ref.sustained && (
                <span className="text-amber-500/80">Sustained</span>
              )}
            </div>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PsychicTab({ psychic, psyRating, editable, onUpdate }: PsychicTabProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  // ── Field updates ────────────────────────────────────────────────────────

  const handleToggleDiscipline = useCallback(
    (d: string) => {
      if (!editable) return;
      const current = psychic.disciplines ?? [];
      const next = current.includes(d)
        ? current.filter((x) => x !== d)
        : [...current, d];
      onUpdate({ ...psychic, disciplines: next });
    },
    [editable, psychic, onUpdate]
  );

  // ── Power array operations ────────────────────────────────────────────────

  const {
    addMinorPower,
    addMajorPower,
    removeMinorPower,
    removeMajorPower,
  } = usePsychicPowers({ psychic, editable, onUpdate });

  /** Add a power from the reference picker */
  const fromReference = useCallback(
    (ref: PsychicPowerRef) => {
      if (!editable) return;
      const newPower: PsychicPower = {
        id: crypto.randomUUID(),
        name: ref.name,
        discipline: ref.discipline,
        threshold: String(ref.threshold),
        focusTime: ref.focusTime,
        sustained: ref.sustained ? "Yes" : "No",
        range: ref.range,
        description: ref.description,
        isMinor: ref.discipline === "Minor",
        known: true,
      };
      const type = ref.discipline === "Minor" ? "minorPowers" : "majorPowers";
      onUpdate({
        ...psychic,
        [type]: [...psychic[type], newPower],
      });
      setPickerTarget(null);
    },
    [editable, psychic, onUpdate]
  );

  const openPickerForMinor = useCallback(() => setPickerTarget("minor"), []);
  const openPickerForMajor = useCallback(() => setPickerTarget("major"), []);

  // ── Render ────────────────────────────────────────────────────────────────

  const pickerInitialDiscipline: DisciplineFilter =
    pickerTarget === "minor" ? "Minor" : "All";

  return (
    <div className="space-y-6">
      {/* PSY RATING & DISCIPLINES ────────────────────────────────────────── */}
      <div className={sectionContainerClass(editable) + " flex flex-col items-center space-y-3"}>

        {/* Psy Rating — derived from highest Psy Rating talent */}
        <div className="inline-flex flex-col items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-100">Psy Rating</span>
          <div className="relative inline-flex">
            <div className="w-[26px] h-[26px] flex items-center justify-center rounded border border-indigo-500/50 bg-indigo-950/40">
              <span className="text-sm font-bold font-mono text-indigo-300">{psyRating}</span>
            </div>
            {psyRating > 0 && (
              <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2">
                <InfoModal
                  title={`Psy Rating ${psyRating}`}
                  content={<p className="text-sm text-slate-300 leading-relaxed">{TALENT_DESCRIPTIONS[`psy-rating-${psyRating}`]}</p>}
                />
              </div>
            )}
          </div>
        </div>

        {/* Disciplines — toggle chips, one per major discipline */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-100 mb-1.5 text-center">Disciplines</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor").map((d) => {
              const active = (psychic.disciplines ?? []).includes(d);
              return (
                <button
                  key={d}
                  disabled={!editable}
                  onClick={() => handleToggleDiscipline(d)}
                  aria-pressed={active}
                  className={[
                    "px-2.5 py-1 rounded border text-xs transition",
                    active
                      ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                      : editable
                      ? "border-slate-500 text-slate-100 hover:bg-slate-800"
                      : "border-slate-700 text-slate-500 opacity-60 cursor-not-allowed",
                  ].join(" ")}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* MINOR POWERS ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>Minor Powers</h3>
          <button
            onClick={openPickerForMinor}
            className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
            aria-label={editable ? "Add Minor Power" : "View Minor Powers"}
          >
            {editable ? "+ Add Minor Power" : "View"}
          </button>
        </div>

        {psychic.minorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No minor powers recorded.</p>
        ) : (
          <div className="space-y-3">
            {[...psychic.minorPowers].sort((a, b) => a.name.localeCompare(b.name)).map((power) => (
              <PowerCard
                key={power.id}
                power={power}
                editable={editable}
                onRemove={removeMinorPower}
              />
            ))}
          </div>
        )}
      </section>

      {/* MAJOR POWERS ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>Major Powers</h3>
          <button
            onClick={openPickerForMajor}
            className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
            aria-label={editable ? "Add Major Power" : "View Major Powers"}
          >
            {editable ? "+ Add Major Power" : "View"}
          </button>
        </div>

        {psychic.majorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No major powers recorded.</p>
        ) : (
          <div className="space-y-3">
            {[...psychic.majorPowers].sort((a, b) => a.name.localeCompare(b.name)).map((power) => (
              <PowerCard
                key={power.id}
                power={power}
                editable={editable}
                onRemove={removeMajorPower}
              />
            ))}
          </div>
        )}
      </section>

      {/* POWER PICKER MODAL ──────────────────────────────────────────────── */}
      {pickerTarget !== null && (
        <PowerPicker
          initialDiscipline={pickerInitialDiscipline}
          excludeMinor={pickerTarget === "major"}
          minorOnly={pickerTarget === "minor"}
          editable={editable}
          existingNames={new Set([
            ...psychic.minorPowers.map((p) => p.name),
            ...psychic.majorPowers.map((p) => p.name),
          ])}
          onSelect={fromReference}
          onCustomMinor={() => {
            setPickerTarget(null);
            addMinorPower();
          }}
          onCustomMajor={() => {
            setPickerTarget(null);
            addMajorPower();
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
