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
import { PickerModal } from "../../ui/PickerModal";
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
  }).sort((a, b) => a.name.localeCompare(b.name));

  const allFilters: DisciplineFilter[] = ["All", ...PSYCHIC_DISCIPLINES];

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
      footer={
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
      }
    >
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
    </PickerModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PsychicTab({ psychic, editable, onUpdate }: PsychicTabProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  // ── Field updates ────────────────────────────────────────────────────────

  const handlePsyRatingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editable) return;
      onUpdate({ ...psychic, psyRating: Number(e.target.value) });
    },
    [editable, psychic, onUpdate]
  );

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
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Psychic Powers</h2>

      {/* PSY RATING & DISCIPLINES ────────────────────────────────────────── */}
      <div className={sectionContainerClass(editable) + " space-y-3"}>

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

        {/* Disciplines — toggle chips, one per major discipline */}
        <div>
          <p className="text-xs text-slate-400 mb-1.5">Disciplines</p>
          <div className="flex flex-wrap gap-1.5">
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
                      ? "border-slate-600 text-slate-300 hover:bg-slate-800"
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
