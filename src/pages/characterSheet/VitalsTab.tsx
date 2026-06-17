// src/pages/characterSheet/VitalsTab.tsx

import { useCallback } from "react";
import { Stepper } from "../../components/Stepper";
import type {
  Character,
  WoundsBlock,
  FateBlock,
  InsanityBlock,
  CorruptionBlock,
} from "../../types/Character";
import {
  uiSection,
  uiCell,
  uiCellValue,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { FormField } from "../../components/FormField";
import { WOUNDS_CRITICAL_THRESHOLD, FATE_CRITICAL_THRESHOLD } from "../../constants/gameRules";

interface VitalsTabProps {
  character: Character;
  editable: boolean;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;
  onUpdateInsanity: (next: InsanityBlock) => void;
  onUpdateCorruption: (next: CorruptionBlock) => void;
}

const totalInputClass =
  "w-full rounded border px-2 lg:px-3 py-1.5 lg:py-2 text-center text-xl lg:text-2xl font-semibold font-mono transition bg-slate-900 border-slate-500 text-slate-200 focus:outline-none focus:border-red-500";

export function VitalsTab({
  character,
  editable,
  onUpdateWounds,
  onUpdateFate,
  onUpdateInsanity,
  onUpdateCorruption,
}: VitalsTabProps) {
  const { wounds, fate } = character;
  const insanity = character.insanity ?? { points: 0, disorders: "" };
  const corruption = character.corruption ?? { points: 0, malignancies: "" };

  const handleCurrentWoundsChange = useCallback(
    (v: number) => onUpdateWounds({ ...wounds, current: v }),
    [wounds, onUpdateWounds]
  );
  const handleCriticalDamageChange = useCallback(
    (v: number) => onUpdateWounds({ ...wounds, criticalDamage: v }),
    [wounds, onUpdateWounds]
  );
  const handleFatigueChange = useCallback(
    (v: number) => onUpdateWounds({ ...wounds, fatigue: v }),
    [wounds, onUpdateWounds]
  );
  const handleWoundsTotalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdateWounds({ ...wounds, total: Math.max(0, Number(e.target.value)) }),
    [wounds, onUpdateWounds]
  );

  const handleCurrentFateChange = useCallback(
    (v: number) => onUpdateFate({ ...fate, current: v }),
    [fate, onUpdateFate]
  );
  const handleFateTotalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdateFate({ ...fate, total: Math.max(0, Number(e.target.value)) }),
    [fate, onUpdateFate]
  );

  const handleInsanityPointsChange = useCallback(
    (v: number) => onUpdateInsanity({ ...insanity, points: v }),
    [insanity, onUpdateInsanity]
  );
  const handleInsanityDisordersChange = useCallback(
    (v: string) => onUpdateInsanity({ ...insanity, disorders: v }),
    [insanity, onUpdateInsanity]
  );

  const handleCorruptionPointsChange = useCallback(
    (v: number) => onUpdateCorruption({ ...corruption, points: v }),
    [corruption, onUpdateCorruption]
  );
  const handleMalignanciesChange = useCallback(
    (v: string) => onUpdateCorruption({ ...corruption, malignancies: v }),
    [corruption, onUpdateCorruption]
  );

  // ------------------------------
  // Danger state helpers
  // ------------------------------
  function dangerClass(value: number, criticalThreshold: number): string {
    return value <= criticalThreshold ? "text-red-400 font-semibold" : "";
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* COMBAT STATUS */}
      <div>
        <SectionHeader className="mb-2">Combat Status</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Total Wounds */}
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Total Wounds</div>
              <div className="flex-1 flex items-center justify-center">
                {editable ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    className={totalInputClass}
                    value={wounds.total}
                    onChange={handleWoundsTotalChange}
                    aria-label="Total wounds"
                  />
                ) : (
                  <div className={uiCellValue}>{wounds.total}</div>
                )}
              </div>
            </div>

            {/* Current Wounds */}
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Current Wounds</div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={wounds.current}
                  editable={editable}
                  onChange={handleCurrentWoundsChange}
                  dangerClassName={dangerClass(wounds.current, WOUNDS_CRITICAL_THRESHOLD)}
                />
              </div>
            </div>

            {/* Critical Damage */}
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Critical Damage</div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={wounds.criticalDamage}
                  editable={editable}
                  onChange={handleCriticalDamageChange}
                />
              </div>
            </div>

            {/* Fatigue */}
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Fatigue</div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={wounds.fatigue}
                  editable={editable}
                  onChange={handleFatigueChange}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FATE */}
      <div>
        <SectionHeader className="mb-2">Fate Points</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-2 gap-3">
            {/* Total */}
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Total</div>
              <div className="flex-1 flex items-center justify-center">
                {editable ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    className={totalInputClass}
                    value={fate.total}
                    onChange={handleFateTotalChange}
                    aria-label="Total fate points"
                  />
                ) : (
                  <div className={uiCellValue}>{fate.total}</div>
                )}
              </div>
            </div>

            {/* Current */}
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Current</div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={fate.current}
                  editable={editable}
                  onChange={handleCurrentFateChange}
                  dangerClassName={dangerClass(fate.current, FATE_CRITICAL_THRESHOLD)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* INSANITY & CORRUPTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* INSANITY */}
        <div>
          <SectionHeader className="mb-2">Insanity</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            <div className="flex items-center gap-3">
              <span className="text-xs lg:text-sm text-slate-100 uppercase tracking-wide">Points</span>
              <Stepper
                value={insanity.points}
                editable={editable}
                onChange={handleInsanityPointsChange}
              />
            </div>
            <FormField
              label="Disorders"
              value={insanity.disorders}
              onChange={handleInsanityDisordersChange}
              editable={editable}
              type="textarea"
              rows={2}
              placeholder="List any disorders…"
            />
          </section>
        </div>

        {/* CORRUPTION */}
        <div>
          <SectionHeader className="mb-2">Corruption</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            <div className="flex items-center gap-3">
              <span className="text-xs lg:text-sm text-slate-100 uppercase tracking-wide">Points</span>
              <Stepper
                value={corruption.points}
                editable={editable}
                onChange={handleCorruptionPointsChange}
              />
            </div>
            <FormField
              label="Malignancies"
              value={corruption.malignancies}
              onChange={handleMalignanciesChange}
              editable={editable}
              type="textarea"
              rows={2}
              placeholder="List any malignancies…"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
