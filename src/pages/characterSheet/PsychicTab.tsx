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
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { PowerCard } from "./components/PowerCard";
import { usePsychicPowers } from "../../hooks/usePsychicPowers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PsychicTabProps {
  psychic: PsychicBlock;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

type PickerTarget = "minor" | "major" | null;
type DisciplineFilter = PsychicDiscipline | "All";

// ─── Sub-component: Power Picker Modal ───────────────────────────────────────

function PowerPicker({
  initialDiscipline,
  onSelect,
  onCustomMinor,
  onCustomMajor,
  onClose,
}: {
  initialDiscipline: DisciplineFilter;
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
    return matchesQuery && matchesDiscipline;
  });

  const allFilters: DisciplineFilter[] = ["All", ...PSYCHIC_DISCIPLINES];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Psychic Power</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search powers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>

        {/* Discipline filter chips */}
        <div className="px-4 py-2 border-b border-slate-800 flex flex-wrap gap-1.5">
          {allFilters.map((d) => (
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
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
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
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 text-left">
                {ref.description}
              </p>
            </button>
          ))}
        </div>

        {/* Custom options */}
        <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
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
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PsychicTab({ psychic, editable, onUpdate }: PsychicTabProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  // ── Field updates ────────────────────────────────────────────────────────

  const updateField = useCallback(
    (key: keyof PsychicBlock, value: string | number) => {
      if (!editable) return;
      onUpdate({ ...psychic, [key]: value });
    },
    [editable, psychic, onUpdate]
  );

  const handlePsyRatingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("psyRating", Number(e.target.value));
    },
    [updateField]
  );

  const handleDisciplineChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateField("discipline", e.target.value);
    },
    [updateField]
  );

  // ── Power array operations ────────────────────────────────────────────────

  const {
    addMinorPower,
    addMajorPower,
    removeMinorPower,
    removeMajorPower,
    updateMinorPower,
    updateMajorPower,
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
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Psychic Powers</h2>

      {/* PSY RATING & DISCIPLINE ──────────────────────────────────────────── */}
      <div className={sectionContainerClass(editable) + " space-y-3"}>
        <div className="grid grid-cols-2 gap-3">

          {/* Psy Rating */}
          <label className="flex flex-col gap-0.5 text-xs text-slate-400">
            Psy Rating
            <input
              disabled={!editable}
              type="number"
              min={0}
              max={10}
              value={psychic.psyRating ?? 0}
              onChange={handlePsyRatingChange}
              className={editableInputClass(editable) + " w-24"}
              aria-label="Psy Rating"
            />
          </label>

          {/* Discipline */}
          <label className="flex flex-col gap-0.5 text-xs text-slate-400">
            Discipline
            {editable ? (
              <select
                value={psychic.discipline ?? ""}
                onChange={handleDisciplineChange}
                className={editableInputClass(true)}
              >
                <option value="">— None —</option>
                {PSYCHIC_DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-slate-200">
                {psychic.discipline || <span className="text-slate-500 italic">—</span>}
              </span>
            )}
          </label>

        </div>
      </div>

      {/* MINOR POWERS ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Minor Powers</h3>
          {editable && (
            <button
              onClick={openPickerForMinor}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
              aria-label="Add Minor Power"
            >
              + Add Minor Power
            </button>
          )}
        </div>

        {psychic.minorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No minor powers recorded.</p>
        ) : (
          <div className="space-y-3">
            {psychic.minorPowers.map((power, index) => (
              <PowerCard
                key={power.id}
                power={power}
                index={index}
                editable={editable}
                onUpdate={updateMinorPower}
                onRemove={removeMinorPower}
              />
            ))}
          </div>
        )}
      </section>

      {/* MAJOR POWERS ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Major Powers</h3>
          {editable && (
            <button
              onClick={openPickerForMajor}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
              aria-label="Add Major Power"
            >
              + Add Major Power
            </button>
          )}
        </div>

        {psychic.majorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No major powers recorded.</p>
        ) : (
          <div className="space-y-3">
            {psychic.majorPowers.map((power, index) => (
              <PowerCard
                key={power.id}
                power={power}
                index={index}
                editable={editable}
                onUpdate={updateMajorPower}
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
