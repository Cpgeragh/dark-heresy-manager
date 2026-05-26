// src/pages/characterSheet/OverviewTab.tsx

import { useState, useCallback } from "react";
import { InfoModal } from "../../components/InfoModal";
import type {
  Character,
  CharacterHeader,
  WoundsBlock,
  FateBlock,
} from "../../types/Character";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
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
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;
  getCharTotal: (statKey: keyof Character["characteristics"]) => number;
  isReleasing?: boolean;
}

export function OverviewTab({
  character,
  editable,
  canPlayerRelease,
  onPlayerRelease,
  onUpdateHeader,
  onUpdateWounds,
  onUpdateFate,
  getCharTotal,
  isReleasing = false,
}: OverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const { header, wounds, fate, recoveryCode } = character;

  // ------------------------------
  // Update helpers
  // ------------------------------
  const updateHeaderField = useCallback(<K extends keyof CharacterHeader>(
    key: K,
    value: CharacterHeader[K]
  ) => {
    onUpdateHeader({ ...header, [key]: value });
  }, [header, onUpdateHeader]);

  const handleCharacterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateHeaderField("characterName", e.target.value);
  }, [updateHeaderField]);

  const adjustWounds = useCallback((delta: number) => {
    if (!editable) return;
    onUpdateWounds({ ...wounds, current: wounds.current + delta });
  }, [editable, wounds, onUpdateWounds]);

  const handleWoundsMinus = useCallback(() => {
    adjustWounds(-1);
  }, [adjustWounds]);

  const handleWoundsPlus = useCallback(() => {
    adjustWounds(1);
  }, [adjustWounds]);

  const handleCriticalDamageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateWounds({
      ...wounds,
      criticalDamage: Number(e.target.value),
    });
  }, [wounds, onUpdateWounds]);

  const handleFatigueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateWounds({
      ...wounds,
      fatigue: Number(e.target.value),
    });
  }, [wounds, onUpdateWounds]);

  const adjustFate = useCallback((delta: number) => {
    if (!editable) return;
    onUpdateFate({
      ...fate,
      current: Math.max(0, fate.current + delta),
    });
  }, [editable, fate, onUpdateFate]);

  const handleFateMinus = useCallback(() => {
    adjustFate(-1);
  }, [adjustFate]);

  const handleFatePlus = useCallback(() => {
    adjustFate(1);
  }, [adjustFate]);

  // ------------------------------
  // Danger state helpers
  // ------------------------------
  function woundsDangerClass(value: number) {
    return value <= WOUNDS_CRITICAL_THRESHOLD ? "text-red-400 font-semibold" : "";
  }

  function fateDangerClass(value: number) {
    return value === FATE_CRITICAL_THRESHOLD ? "text-red-400 font-semibold" : "";
  }

  // ------------------------------
  // Clipboard
  // ------------------------------
  async function copyCode() {
    if (!recoveryCode) return;
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
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
      {/* CHARACTER NAME */}
      <section className={sectionContainerClass(editable)}>
        <label className="block text-xs text-slate-400">
          Character Name
          <input
            disabled={!editable}
            className={editableInputClass(editable) + " mt-1"}
            value={header.characterName ?? ""}
            onChange={handleCharacterNameChange}
          />
        </label>
      </section>

      {/* WOUNDS */}
      <section className={sectionContainerClass(editable)}>
        <h2 className="text-lg font-semibold mb-3">Wounds</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total */}
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-semibold font-mono text-slate-100">
              {wounds.total}
            </div>
          </div>

          {/* Current */}
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-2">Current</div>
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={!editable}
                onClick={handleWoundsMinus}
                aria-label="Decrease current wounds"
                className={`px-2 py-0.5 border rounded text-xs transition
                  ${editable
                    ? "border-slate-600 hover:bg-slate-800"
                    : "border-slate-700 opacity-50 cursor-not-allowed"
                  }`}
              >
                −
              </button>
              <span
                className={`min-w-[2ch] text-center text-xl font-semibold font-mono ${woundsDangerClass(wounds.current)}`}
              >
                {wounds.current}
              </span>
              <button
                disabled={!editable}
                onClick={handleWoundsPlus}
                aria-label="Increase current wounds"
                className={`px-2 py-0.5 border rounded text-xs transition
                  ${editable
                    ? "border-slate-600 hover:bg-slate-800"
                    : "border-slate-700 opacity-50 cursor-not-allowed"
                  }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Critical Damage */}
          <div className={sectionContainerClass(false) + " text-center"}>
            <label className="text-xs text-slate-400">
              Critical Damage
              <input
                type="number"
                disabled={!editable}
                className={editableInputClass(editable) + " mt-2 text-center"}
                value={wounds.criticalDamage}
                onChange={handleCriticalDamageChange}
                aria-label="Critical damage points"
              />
            </label>
          </div>

          {/* Fatigue */}
          <div className={sectionContainerClass(false) + " text-center"}>
            <label className="text-xs text-slate-400">
              Fatigue
              <input
                type="number"
                disabled={!editable}
                className={editableInputClass(editable) + " mt-2 text-center"}
                value={wounds.fatigue}
                onChange={handleFatigueChange}
                aria-label="Fatigue points"
              />
            </label>
          </div>
        </div>
      </section>

      {/* FATE */}
      <section className={sectionContainerClass(editable)}>
        <h2 className="text-lg font-semibold mb-3">Fate Points</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Total */}
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-semibold font-mono text-slate-100">
              {fate.total}
            </div>
          </div>

          {/* Current */}
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-2">Current</div>
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={!editable}
                onClick={handleFateMinus}
                aria-label="Decrease current fate points"
                className={`px-2 py-0.5 border rounded text-xs transition
                  ${editable
                    ? "border-slate-600 hover:bg-slate-800"
                    : "border-slate-700 opacity-50 cursor-not-allowed"
                  }`}
              >
                −
              </button>
              <span
                className={`min-w-[2ch] text-center text-xl font-semibold font-mono ${fateDangerClass(fate.current)}`}
              >
                {fate.current}
              </span>
              <button
                disabled={!editable}
                onClick={handleFatePlus}
                aria-label="Increase current fate points"
                className={`px-2 py-0.5 border rounded text-xs transition
                  ${editable
                    ? "border-slate-600 hover:bg-slate-800"
                    : "border-slate-700 opacity-50 cursor-not-allowed"
                  }`}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOVEMENT */}
      <section className={sectionContainerClass(false)}>
        <div className="flex items-center gap-2 mb-3">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-1">Half</div>
            <div className="text-2xl font-semibold font-mono text-slate-100">{move.half}</div>
          </div>
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-1">Full</div>
            <div className="text-2xl font-semibold font-mono text-slate-100">{move.full}</div>
          </div>
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-1">Charge</div>
            <div className="text-2xl font-semibold font-mono text-slate-100">{move.charge}</div>
          </div>
          <div className={sectionContainerClass(false) + " text-center"}>
            <div className="text-xs text-slate-400 mb-1">Run</div>
            <div className="text-2xl font-semibold font-mono text-slate-100">{move.run}</div>
          </div>
        </div>
      </section>

      {/* RECOVERY CODE */}
      {recoveryCode && (
        <section className={sectionContainerClass(false)}>
          <div className="text-xs text-slate-400">Recovery Code</div>

          <div className="flex items-center gap-2 mt-1">
            <code className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-amber-300">
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