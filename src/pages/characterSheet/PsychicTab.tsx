// src/pages/characterSheet/PsychicTab.tsx

import { useCallback } from "react";
import type { PsychicBlock } from "../../types/Character";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";
import { PowerCard } from "./components/PowerCard";
import { usePsychicPowers } from "../../hooks/usePsychicPowers";

interface PsychicTabProps {
  psychic: PsychicBlock;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void;
}

export function PsychicTab({ psychic, editable, onUpdate }: PsychicTabProps) {
  // ================================================================
  // BASIC FIELD UPDATES
  // ================================================================
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
    (v: string) => {
      updateField("discipline", v);
    },
    [updateField]
  );

  // ================================================================
  // POWER ARRAY OPERATIONS (using extracted hook)
  // ================================================================
  const {
    addMinorPower,
    addMajorPower,
    removeMinorPower,
    removeMajorPower,
    updateMinorPower,
    updateMajorPower,
  } = usePsychicPowers({ psychic, editable, onUpdate });

  // ================================================================
  // RENDER
  // ================================================================
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
              aria-label="Psy Rating"
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

      {/* MAJOR POWERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Major Powers</h3>
          {editable && (
            <button
              onClick={addMajorPower}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
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
    </div>
  );
}