// src/pages/characterSheet/PsychicTab.tsx

import { useState, useCallback, useRef } from "react";
import type { TouchEvent } from "react";
import type { PsychicBlock, PsychicPower } from "../../types/Character";
import {
  PSYCHIC_POWER_REFERENCE,
  PSYCHIC_DISCIPLINES,
  type PsychicPowerRef,
  type PsychicDiscipline,
} from "../../data/reference/psychicReference";
import { editableInputClass, editableTextareaClass, uiSection } from "../../ui/editableStyles";
import { Button } from "../../ui/Button";
import { SectionHeader } from "../../ui/SectionHeader";
import { PowerCard } from "./components/PowerCard";
import { PickerModal } from "../../ui/PickerModal";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { sourceColour } from "../../ui/sourceStyles";
import { powerGroupActiveColour, psychicDisciplineColour, psyRatingGlow } from "./psychicStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PsychicTabProps {
  psychic: PsychicBlock;
  psyRating: number;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

type PickerTarget = "minor" | "major" | null;
type PowerGroup = "minor" | "major";
type DisciplineFilter = PsychicDiscipline | "All";
type CustomPowerOrigin = "Custom" | "2nd Ed";
type CustomRangeMode = "meters" | "km-radius" | "you" | "unlimited";

// ─── Sub-component: Power Picker Modal ───────────────────────────────────────

function PowerPicker({
  initialDiscipline,
  excludeMinor = false,
  minorOnly = false,
  editable = true,
  existingNames,
  onSelect,
  onCustom,
  onClose,
}: {
  initialDiscipline: DisciplineFilter;
  excludeMinor?: boolean;
  minorOnly?: boolean;
  editable?: boolean;
  existingNames: Set<string>;
  onSelect: (ref: PsychicPowerRef) => void;
  onCustom: () => void;
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
              ? d === "All"
                ? "border-slate-400 bg-slate-700 text-slate-100"
                : psychicDisciplineColour(d)
              : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
          ].join(" ")}
        >
          {d}
        </button>
      ))}
      footer={
        editable ? (
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1 transition"
          >
            {minorOnly ? "+ Custom minor power" : "+ Custom major power"}
          </button>
        ) : undefined
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </span>
            {ref.description && (
              <span
                className="inline-flex items-center leading-[0] shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <InfoModal
                  title={ref.name}
                  content={
                    <p className="text-sm text-slate-300 leading-relaxed">{ref.description}</p>
                  }
                />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
            <span
              className={`rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(ref.source)}`}
            >
              {ref.source}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 font-medium ${psychicDisciplineColour(ref.discipline)}`}
            >
              {ref.discipline}
            </span>
            <span className="font-mono">PT {ref.threshold}</span>
            <span>{ref.focusTime}</span>
            <span>{ref.range}</span>
            {ref.sustained && <span className="text-amber-500/80">Sustained</span>}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

function CustomPowerForm({
  target,
  existingNames,
  onAdd,
  onCancel,
}: {
  target: PowerGroup;
  existingNames: Set<string>;
  onAdd: (power: PsychicPower) => void;
  onCancel: () => void;
}) {
  const majorDisciplines = PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discipline, setDiscipline] = useState<PsychicDiscipline | "">(
    target === "minor" ? "Minor" : ""
  );
  const [threshold, setThreshold] = useState("");
  const [focusTime, setFocusTime] = useState<"" | "Half Action" | "Full Action">("");
  const [rangeMode, setRangeMode] = useState<CustomRangeMode>("meters");
  const [rangeValue, setRangeValue] = useState("");
  const [sustained, setSustained] = useState<"" | "Yes" | "No">("");
  const [origin, setOrigin] = useState<"" | CustomPowerOrigin>("");

  const trimmedName = name.trim();
  const nameExists = existingNames.has(trimmedName);
  const thresholdIsValid = /^[1-9]\d*$/.test(threshold);
  const rangeValueIsValid =
    rangeMode === "you" || rangeMode === "unlimited" || /^[1-9]\d*$/.test(rangeValue);
  const canAdd =
    !!trimmedName &&
    !nameExists &&
    !!discipline &&
    thresholdIsValid &&
    !!focusTime &&
    rangeValueIsValid &&
    !!sustained &&
    !!origin;

  function handlePositiveIntegerChange(value: string, setter: (next: string) => void) {
    if (/^\d*$/.test(value)) setter(value);
  }

  function formatRange() {
    if (rangeMode === "you") return "You";
    if (rangeMode === "unlimited") return "Unlimited";
    if (rangeMode === "km-radius") return `${rangeValue} km radius`;
    return `${rangeValue}m`;
  }

  function handleAdd() {
    if (!canAdd) return;
    onAdd({
      id: crypto.randomUUID(),
      name: trimmedName,
      discipline,
      threshold,
      focusTime,
      range: formatRange(),
      sustained,
      source: origin,
      description: description.trim() || undefined,
      isMinor: target === "minor",
      custom: true,
      known: true,
    });
  }

  return (
    <PickerModal
      title={`Custom ${target === "minor" ? "Minor" : "Major"} Power`}
      query=""
      onQueryChange={() => undefined}
      onClose={onCancel}
      closeLabel="←"
      hideSearch
      isEmpty={false}
      maxHeight="max-h-[85vh]"
    >
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Power name..."
            className={editableInputClass(true)}
            autoFocus
          />
          {nameExists && (
            <p className="text-xs text-red-300">That power is already on this character.</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Discipline <span className="text-red-400">*</span>
          </label>
          {target === "minor" ? (
            <div
              className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${psychicDisciplineColour("Minor")}`}
            >
              Minor
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {majorDisciplines.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d)}
                  className={[
                    "text-xs px-2.5 py-1 rounded border transition",
                    discipline === d
                      ? `${psychicDisciplineColour(d)} font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
              PT <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => handlePositiveIntegerChange(e.target.value, setThreshold)}
              placeholder="e.g. 8"
              className={editableInputClass(true) + " font-mono"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
              Action <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Half Action", "Full Action"] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setFocusTime(action)}
                  className={[
                    "text-xs px-2 py-1 rounded border transition",
                    focusTime === action
                      ? "border-amber-400 bg-amber-500 text-slate-950 font-semibold"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {action.replace(" Action", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Range <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              ["meters", "Metres"],
              ["km-radius", "km radius"],
              ["you", "You"],
              ["unlimited", "Unlimited"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRangeMode(mode as CustomRangeMode)}
                className={[
                  "text-xs px-2 py-1 rounded border transition",
                  rangeMode === mode
                    ? "border-amber-400 bg-amber-500 text-slate-950 font-semibold"
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          {(rangeMode === "meters" || rangeMode === "km-radius") && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                inputMode="numeric"
                value={rangeValue}
                onChange={(e) => handlePositiveIntegerChange(e.target.value, setRangeValue)}
                placeholder="e.g. 10"
                className={editableInputClass(true) + " w-28 font-mono"}
              />
              <span className="text-xs text-slate-400">
                {rangeMode === "km-radius" ? "km radius" : "metres"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
              Sustained <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Yes", "No"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSustained(value)}
                  className={[
                    "text-xs px-2 py-1 rounded border transition",
                    sustained === value
                      ? "border-amber-400 bg-amber-500 text-slate-950 font-semibold"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
              Origin <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Custom", "2nd Ed"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrigin(value)}
                  className={[
                    "text-xs px-2 py-1 rounded border transition",
                    origin === value
                      ? `${sourceColour(value)} bg-slate-800/70 font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Description <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rules text, notes, overbleed..."
            rows={4}
            className={editableTextareaClass(true)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleAdd} disabled={!canAdd}>
            Add Power
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </PickerModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PowerGrid({
  powers,
  editable,
  onRemove,
}: {
  powers: PsychicPower[];
  editable: boolean;
  onRemove: (id: string) => void;
}) {
  const sortedPowers = [...powers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3">
      {sortedPowers.map((power) => (
        <PowerCard key={power.id} power={power} editable={editable} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function PsychicTab({ psychic, psyRating, editable, onUpdate }: PsychicTabProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [customTarget, setCustomTarget] = useState<PickerTarget>(null);
  const [activePowerGroup, setActivePowerGroup] = useState<PowerGroup>(() =>
    psychic.minorPowers.length === 0 && psychic.majorPowers.length > 0 ? "major" : "minor"
  );
  const [powerTransition, setPowerTransition] = useState<"idle" | "sliding">("idle");
  const touchStartX = useRef<number | null>(null);

  // ── Field updates ────────────────────────────────────────────────────────

  const handleToggleDiscipline = useCallback(
    (d: string) => {
      if (!editable) return;
      const current = psychic.disciplines ?? [];
      const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
      onUpdate({ ...psychic, disciplines: next });
    },
    [editable, psychic, onUpdate]
  );

  // ── Power array operations ────────────────────────────────────────────────

  const removeMinorPower = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate({
        ...psychic,
        minorPowers: psychic.minorPowers.filter((p) => p.id !== id),
      });
    },
    [editable, psychic, onUpdate]
  );

  const removeMajorPower = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate({
        ...psychic,
        majorPowers: psychic.majorPowers.filter((p) => p.id !== id),
      });
    },
    [editable, psychic, onUpdate]
  );

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
        source: ref.source,
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
  const addCustomPower = useCallback(
    (power: PsychicPower) => {
      if (!editable || customTarget === null) return;
      const type = customTarget === "minor" ? "minorPowers" : "majorPowers";
      onUpdate({
        ...psychic,
        [type]: [...psychic[type], power],
      });
      setCustomTarget(null);
    },
    [editable, customTarget, psychic, onUpdate]
  );
  const switchPowerGroup = useCallback((group?: PowerGroup) => {
    setActivePowerGroup((current) => {
      const next = group ?? (current === "minor" ? "major" : "minor");
      if (next === current) return current;
      setPowerTransition("sliding");
      window.setTimeout(() => setPowerTransition("idle"), 180);
      return next;
    });
  }, []);
  const handlePowerTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);
  const handlePowerTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 50) return;
    switchPowerGroup();
  }, [switchPowerGroup]);

  // ── Render ────────────────────────────────────────────────────────────────

  const pickerInitialDiscipline: DisciplineFilter = pickerTarget === "minor" ? "Minor" : "All";
  const activePowers =
    activePowerGroup === "minor" ? psychic.minorPowers : psychic.majorPowers;
  const activeRemove =
    activePowerGroup === "minor" ? removeMinorPower : removeMajorPower;
  const activeOpenPicker =
    activePowerGroup === "minor" ? openPickerForMinor : openPickerForMajor;
  const activeTitle = activePowerGroup === "minor" ? "Minor Powers" : "Major Powers";
  const activeEmptyText =
    activePowerGroup === "minor" ? "No minor powers recorded." : "No major powers recorded.";
  const activeAddLabel =
    activePowerGroup === "minor" ? "+ Add Minor Power" : "+ Add Major Power";
  const transitionClass =
    powerTransition === "sliding"
      ? activePowerGroup === "minor"
        ? "opacity-0 -translate-x-3"
        : "opacity-0 translate-x-3"
      : "opacity-100 translate-x-0";
  const existingPowerNames = new Set([
    ...psychic.minorPowers.map((p) => p.name),
    ...psychic.majorPowers.map((p) => p.name),
  ]);

  return (
    <div className="space-y-6">
      {/* PSY RATING & DISCIPLINES ────────────────────────────────────────── */}
      <div className={uiSection + " flex flex-col items-center space-y-3"}>
        {/* Psy Rating — derived from highest Psy Rating talent */}
        <div className="inline-flex flex-col items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Psy Rating
          </span>
          <div className="relative inline-flex">
            <div
              className={[
                "w-[26px] h-[26px] flex items-center justify-center rounded border border-indigo-500/50 bg-indigo-950/40 transition-shadow",
                psyRatingGlow(psyRating),
              ].join(" ")}
            >
              <span className="text-sm font-bold font-mono text-indigo-300">{psyRating}</span>
            </div>
            {psyRating > 0 && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2">
                <InfoModal
                  title={`Psy Rating ${psyRating}`}
                  content={
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {TALENT_DESCRIPTIONS[`psy-rating-${psyRating}`]}
                    </p>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Disciplines — toggle chips, one per major discipline */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-100 mb-1.5 text-center">
            Disciplines
          </p>
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
                      ? `${psychicDisciplineColour(d)} font-semibold`
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
      <div
        className="lg:hidden space-y-4"
        onTouchStart={handlePowerTouchStart}
        onTouchEnd={handlePowerTouchEnd}
      >
        <div
          className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Psychic power groups"
        >
          {(["minor", "major"] as const).map((group) => {
            const active = activePowerGroup === group;
            const count =
              group === "minor" ? psychic.minorPowers.length : psychic.majorPowers.length;
            return (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchPowerGroup(group)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition border",
                  active
                    ? powerGroupActiveColour(group)
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {group === "minor" ? "Minor" : "Major"} ({count})
              </button>
            );
          })}
        </div>

        <section
          key={activePowerGroup}
          className={[
            "space-y-4 transition-all duration-150 ease-out motion-reduce:transition-none",
            transitionClass,
          ].join(" ")}
          role="tabpanel"
        >
          <div className="flex items-center justify-between">
            <SectionHeader>{activeTitle}</SectionHeader>
            <button
              onClick={activeOpenPicker}
              className="text-xs px-3 py-1 rounded border border-amber-400 bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition"
              aria-label={editable ? `Add ${activeTitle.slice(0, -1)}` : `View ${activeTitle}`}
            >
              {editable ? activeAddLabel : "View"}
            </button>
          </div>

          {activePowers.length === 0 ? (
            <p className="text-sm text-slate-400">{activeEmptyText}</p>
          ) : (
            <PowerGrid powers={activePowers} editable={editable} onRemove={activeRemove} />
          )}
        </section>
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <section className={uiSection + " space-y-4"}>
        <div className="flex items-center justify-between">
          <SectionHeader>Minor Powers</SectionHeader>
          <button
            onClick={openPickerForMinor}
            className="text-xs px-3 py-1 rounded border border-amber-400 bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition"
            aria-label={editable ? "Add Minor Power" : "View Minor Powers"}
          >
            {editable ? "+ Add Minor Power" : "View"}
          </button>
        </div>

        {psychic.minorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No minor powers recorded.</p>
        ) : (
          <PowerGrid powers={psychic.minorPowers} editable={editable} onRemove={removeMinorPower} />
        )}
      </section>

      {/* MAJOR POWERS ────────────────────────────────────────────────────── */}
      <section className={uiSection + " space-y-4"}>
        <div className="flex items-center justify-between">
          <SectionHeader>Major Powers</SectionHeader>
          <button
            onClick={openPickerForMajor}
            className="text-xs px-3 py-1 rounded border border-amber-400 bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition"
            aria-label={editable ? "Add Major Power" : "View Major Powers"}
          >
            {editable ? "+ Add Major Power" : "View"}
          </button>
        </div>

        {psychic.majorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No major powers recorded.</p>
        ) : (
          <PowerGrid powers={psychic.majorPowers} editable={editable} onRemove={removeMajorPower} />
        )}
      </section>

      {/* POWER PICKER MODAL ──────────────────────────────────────────────── */}
      </div>

      {pickerTarget !== null && (
        <PowerPicker
          initialDiscipline={pickerInitialDiscipline}
          excludeMinor={pickerTarget === "major"}
          minorOnly={pickerTarget === "minor"}
          editable={editable}
          existingNames={existingPowerNames}
          onSelect={fromReference}
          onCustom={() => {
            if (pickerTarget === null) return;
            setCustomTarget(pickerTarget);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {customTarget !== null && (
        <CustomPowerForm
          target={customTarget}
          existingNames={existingPowerNames}
          onAdd={addCustomPower}
          onCancel={() => setCustomTarget(null)}
        />
      )}
    </div>
  );
}
