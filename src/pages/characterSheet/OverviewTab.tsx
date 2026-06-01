// src/pages/characterSheet/OverviewTab.tsx

import { useState, useCallback } from "react";
import { InfoModal } from "../../components/InfoModal";
import { Stepper } from "../../components/Stepper";
import type {
  Character,
  WoundsBlock,
  FateBlock,
  InsanityBlock,
  CorruptionBlock,
} from "../../types/Character";
import { editableInputClass, uiSection, uiCell, uiCellLabel, uiCellValueSm, uiCellValue } from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";
import {
  CHARACTERISTIC_BONUS_DIVISOR,
  MOVEMENT_HALF_MULTIPLIER,
  MOVEMENT_FULL_MULTIPLIER,
  MOVEMENT_CHARGE_MULTIPLIER,
  MOVEMENT_RUN_MULTIPLIER,
  WOUNDS_CRITICAL_THRESHOLD,
  FATE_CRITICAL_THRESHOLD,
} from "../../constants/gameRules";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";

interface OverviewTabProps {
  character: Character;
  editable: boolean;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;
  onUpdateInsanity: (next: InsanityBlock) => void;
  onUpdateCorruption: (next: CorruptionBlock) => void;
  getCharTotal: (statKey: keyof Character["characteristics"]) => number;
  isReleasing?: boolean;
}

export function OverviewTab({
  character,
  editable,
  canPlayerRelease,
  onPlayerRelease,
  onUpdateWounds,
  onUpdateFate,
  onUpdateInsanity,
  onUpdateCorruption,
  getCharTotal,
  isReleasing = false,
}: OverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const { wounds, fate, recoveryCode } = character;
  const insanity   = character.insanity   ?? { points: 0, disorders: "" };
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

  // ------------------------------
  // Clipboard
  // ------------------------------
  async function copyCode() {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error("Failed to copy recovery code:", err);
    }
  }

  // ------------------------------
  // Movement (auto-calculated)
  // ------------------------------
  const agiTotal = getCharTotal("ag");
  const AB = Math.floor(agiTotal / CHARACTERISTIC_BONUS_DIVISOR);

  const move = {
    half: AB * MOVEMENT_HALF_MULTIPLIER,
    full: AB * MOVEMENT_FULL_MULTIPLIER,
    charge: AB * MOVEMENT_CHARGE_MULTIPLIER,
    run: AB * MOVEMENT_RUN_MULTIPLIER,
  };

  return (
    <div className="space-y-6 text-slate-300">
      {/* COMBAT STATUS */}
      <section className={uiSection}>
        <h2 className="text-lg font-semibold mb-3">Combat Status</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Total Wounds */}
          <div className={uiCell + " text-center p-2"}>
            <div className="text-xs text-slate-300 mb-1">Total Wounds</div>
            {editable ? (
              <input
                type="number"
                min={0}
                className={editableInputClass(true) + " mt-1 text-center"}
                value={wounds.total}
                onChange={handleWoundsTotalChange}
                aria-label="Total wounds"
              />
            ) : (
              <div className={uiCellValue}>
                {wounds.total}
              </div>
            )}
          </div>

          {/* Current Wounds */}
          <div className={uiCell + " text-center p-2"}>
            <div className="text-xs text-slate-300 mb-2">Current Wounds</div>
            <Stepper
              value={wounds.current}
              editable={editable}
              onChange={handleCurrentWoundsChange}
              dangerClassName={dangerClass(wounds.current, WOUNDS_CRITICAL_THRESHOLD)}
            />
          </div>

          {/* Critical Damage */}
          <div className={uiCell + " text-center p-2"}>
            <div className="text-xs text-slate-300 mb-2">Critical Damage</div>
            <Stepper
              value={wounds.criticalDamage}
              editable={editable}
              onChange={handleCriticalDamageChange}
            />
          </div>

          {/* Fatigue */}
          <div className={uiCell + " text-center p-2"}>
            <div className="text-xs text-slate-300 mb-2">Fatigue</div>
            <Stepper
              value={wounds.fatigue}
              editable={editable}
              onChange={handleFatigueChange}
            />
          </div>
        </div>
      </section>

      {/* FATE */}
      <section className={uiSection}>
        <h2 className="text-lg font-semibold mb-3">Fate Points</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Total */}
          <div className={uiCell + " text-center p-2"}>
            <div className="text-xs text-slate-300 mb-1">Total</div>
            {editable ? (
              <input
                type="number"
                min={0}
                className={editableInputClass(true) + " mt-1 text-center"}
                value={fate.total}
                onChange={handleFateTotalChange}
                aria-label="Total fate points"
              />
            ) : (
              <div className={uiCellValue}>
                {fate.total}
              </div>
            )}
          </div>

          {/* Current */}
          <div className={uiCell + " text-center p-2"}>
            <div className="text-xs text-slate-300 mb-2">Current</div>
            <Stepper
              value={fate.current}
              editable={editable}
              onChange={handleCurrentFateChange}
              dangerClassName={dangerClass(fate.current, FATE_CRITICAL_THRESHOLD)}
            />
          </div>
        </div>
      </section>

      {/* INSANITY & CORRUPTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* INSANITY */}
        <section className={uiSection + " space-y-3"}>
          <h2 className="text-lg font-semibold">Insanity</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 uppercase tracking-wide">Points</span>
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

        {/* CORRUPTION */}
        <section className={uiSection + " space-y-3"}>
          <h2 className="text-lg font-semibold">Corruption</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 uppercase tracking-wide">Points</span>
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

      {/* MOVEMENT */}
      <section className={uiSection}>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Movement</h2>
          <InfoModal
            title="Movement"
            content={
              <>
                <div>AB = Agility ÷ {CHARACTERISTIC_BONUS_DIVISOR}</div>
                <div>Half: AB × {MOVEMENT_HALF_MULTIPLIER}</div>
                <div>Full: AB × {MOVEMENT_FULL_MULTIPLIER}</div>
                <div>Charge: AB × {MOVEMENT_CHARGE_MULTIPLIER}</div>
                <div>Run: AB × {MOVEMENT_RUN_MULTIPLIER}</div>
              </>
            }
          />
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Half",   value: move.half },
            { label: "Full",   value: move.full },
            { label: "Charge", value: move.charge },
            { label: "Run",    value: move.run },
          ].map(({ label, value }) => (
            <div key={label} className={uiCell + " text-center py-1 px-0.5"}>
              <div className={uiCellLabel}>{label}</div>
              <div className={uiCellValueSm}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RECOVERY CODE */}
      {recoveryCode && (
        <section className={uiSection}>
          <div className="text-xs text-slate-300">Recovery Code</div>
          <div className="flex items-center gap-2 mt-1">
            <code className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-amber-300">
              {recoveryCode}
            </code>
            <button
              onClick={copyCode}
              aria-label="Copy recovery code to clipboard"
              className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-600 hover:bg-slate-600"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      )}

      {/* RELEASE */}
      {canPlayerRelease && (
        <button
          onClick={onPlayerRelease}
          disabled={isReleasing}
          className={`px-3 py-2 rounded border text-sm transition ${
            isReleasing
              ? "bg-red-800 border-red-900 text-red-300 cursor-wait"
              : "bg-red-600 border-red-700 text-white hover:bg-red-500"
          }`}
        >
          {isReleasing ? "Releasing..." : "Release Character"}
        </button>
      )}
    </div>
  );
}