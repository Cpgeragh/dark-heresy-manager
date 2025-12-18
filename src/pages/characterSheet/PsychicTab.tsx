// src/pages/characterSheet/PsychicTab.tsx

import { useCallback } from "react";
import type { PsychicBlock, PsychicPower } from "../../types/Character";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";

interface PsychicTabProps {
  psychic: PsychicBlock;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

export function PsychicTab({ psychic, editable, onUpdate }: PsychicTabProps) {
  const updateField = useCallback((key: keyof PsychicBlock, value: string | number) => {
    if (!editable) return;
    onUpdate({ ...psychic, [key]: value });
  }, [editable, psychic, onUpdate]);

  const handlePsyRatingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField("psyRating", Number(e.target.value));
  }, [updateField]);

  const handleDisciplineChange = useCallback((v: string) => {
    updateField("discipline", v);
  }, [updateField]);

  const addMinorPower = useCallback(() => {
    if (!editable) return;
    const newPower: PsychicPower = {
      id: crypto.randomUUID(),
      name: "",
      known: true,
      isMinor: true,
    };
    onUpdate({
      ...psychic,
      minorPowers: [...psychic.minorPowers, newPower],
    });
  }, [editable, psychic, onUpdate]);

  const addMajorPower = useCallback(() => {
    if (!editable) return;
    const newPower: PsychicPower = {
      id: crypto.randomUUID(),
      name: "",
      known: true,
      isMinor: false,
    };
    onUpdate({
      ...psychic,
      majorPowers: [...psychic.majorPowers, newPower],
    });
  }, [editable, psychic, onUpdate]);

  const removeMinorPower = useCallback((index: number) => {
    if (!editable) return;
    const powers = [...psychic.minorPowers];
    powers.splice(index, 1);
    onUpdate({ ...psychic, minorPowers: powers });
  }, [editable, psychic, onUpdate]);

  const removeMajorPower = useCallback((index: number) => {
    if (!editable) return;
    const powers = [...psychic.majorPowers];
    powers.splice(index, 1);
    onUpdate({ ...psychic, majorPowers: powers });
  }, [editable, psychic, onUpdate]);

  const updateMinorPower = useCallback((index: number, key: keyof PsychicPower, value: any) => {
    if (!editable) return;
    const powers = [...psychic.minorPowers];
    powers[index] = { ...powers[index], [key]: value };
    onUpdate({ ...psychic, minorPowers: powers });
  }, [editable, psychic, onUpdate]);

  const updateMajorPower = useCallback((index: number, key: keyof PsychicPower, value: any) => {
    if (!editable) return;
    const powers = [...psychic.majorPowers];
    powers[index] = { ...powers[index], [key]: value };
    onUpdate({ ...psychic, majorPowers: powers });
  }, [editable, psychic, onUpdate]);

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Psychic Powers</h2>

      {/* PSY RATING & DISCIPLINE */}
      <div className={sectionContainerClass(editable) + " space-y-3"}>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-0.5 text-xs text-slate-400">
            Psy Rating
            <input
              disabled={!editable}
              type="number"
              value={psychic.psyRating ?? 0}
              onChange={handlePsyRatingChange}
              className={editableInputClass(editable) + " w-24"}
            />
          </label>

          <FormField
            label="Discipline"
            value={psychic.discipline ?? ""}
            onChange={handleDisciplineChange}
            editable={editable}
            placeholder="e.g., Biomancy, Telekinesis"
          />
        </div>
      </div>

      {/* MINOR POWERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Minor Powers</h3>
          {editable && (
            <button
              onClick={addMinorPower}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add Minor Power
            </button>
          )}
        </div>

        {psychic.minorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No minor powers recorded.</p>
        ) : (
          <div className="space-y-3">
            {psychic.minorPowers.map((p, i) => (
              <div
                key={p.id}
                className={sectionContainerClass(editable) + " space-y-2"}
              >
                <div className="flex items-start justify-between gap-2">
                  <FormField
                    label="Power Name"
                    value={p.name ?? ""}
                    onChange={(v) => updateMinorPower(i, "name", v)}
                    editable={editable}
                    className="flex-1"
                  />

                  {editable && (
                    <button
                      onClick={() => removeMinorPower(i)}
                      className="text-xs text-red-400 hover:text-red-300 mt-5"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    label="Threshold"
                    value={p.threshold ?? ""}
                    onChange={(v) => updateMinorPower(i, "threshold", v)}
                    editable={editable}
                    placeholder="e.g., 7"
                  />

                  <FormField
                    label="Focus Time"
                    value={p.focusTime ?? ""}
                    onChange={(v) => updateMinorPower(i, "focusTime", v)}
                    editable={editable}
                    placeholder="e.g., Half Action"
                  />

                  <FormField
                    label="Range"
                    value={p.range ?? ""}
                    onChange={(v) => updateMinorPower(i, "range", v)}
                    editable={editable}
                    placeholder="e.g., 20m"
                  />

                  <FormField
                    label="Sustained"
                    value={p.sustained ?? ""}
                    onChange={(v) => updateMinorPower(i, "sustained", v)}
                    editable={editable}
                    placeholder="e.g., Free Action"
                  />
                </div>

                <FormField
                  label="Effect"
                  value={p.description ?? ""}
                  onChange={(v) => updateMinorPower(i, "description", v)}
                  editable={editable}
                  type="textarea"
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MAJOR POWERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Major Powers</h3>
          {editable && (
            <button
              onClick={addMajorPower}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add Major Power
            </button>
          )}
        </div>

        {psychic.majorPowers.length === 0 ? (
          <p className="text-sm text-slate-400">No major powers recorded.</p>
        ) : (
          <div className="space-y-3">
            {psychic.majorPowers.map((p, i) => (
              <div
                key={p.id}
                className={sectionContainerClass(editable) + " space-y-2"}
              >
                <div className="flex items-start justify-between gap-2">
                  <FormField
                    label="Power Name"
                    value={p.name ?? ""}
                    onChange={(v) => updateMajorPower(i, "name", v)}
                    editable={editable}
                    className="flex-1"
                  />

                  {editable && (
                    <button
                      onClick={() => removeMajorPower(i)}
                      className="text-xs text-red-400 hover:text-red-300 mt-5"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    label="Threshold"
                    value={p.threshold ?? ""}
                    onChange={(v) => updateMajorPower(i, "threshold", v)}
                    editable={editable}
                    placeholder="e.g., 12"
                  />

                  <FormField
                    label="Focus Time"
                    value={p.focusTime ?? ""}
                    onChange={(v) => updateMajorPower(i, "focusTime", v)}
                    editable={editable}
                    placeholder="e.g., Full Action"
                  />

                  <FormField
                    label="Range"
                    value={p.range ?? ""}
                    onChange={(v) => updateMajorPower(i, "range", v)}
                    editable={editable}
                    placeholder="e.g., 50m"
                  />

                  <FormField
                    label="Sustained"
                    value={p.sustained ?? ""}
                    onChange={(v) => updateMajorPower(i, "sustained", v)}
                    editable={editable}
                    placeholder="e.g., Half Action"
                  />
                </div>

                <FormField
                  label="Effect"
                  value={p.description ?? ""}
                  onChange={(v) => updateMajorPower(i, "description", v)}
                  editable={editable}
                  type="textarea"
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}