import { useState } from "react";
import { Tooltip } from "../../components/Tooltip";
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

interface OverviewTabProps {
  character: Character;
  editable: boolean;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;
  getCharTotal: (statKey: keyof Character["characteristics"]) => number;
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
}: OverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const { header, wounds, fate, recoveryCode } = character;

  // ------------------------------
  // Update helpers
  // ------------------------------
  function updateHeaderField<K extends keyof CharacterHeader>(
    key: K,
    value: CharacterHeader[K]
  ) {
    onUpdateHeader({ ...header, [key]: value });
  }

  function adjustWounds(delta: number) {
    if (!editable) return;
    onUpdateWounds({ ...wounds, current: wounds.current + delta });
  }

  function adjustFate(delta: number) {
    if (!editable) return;
    onUpdateFate({
      ...fate,
      current: Math.max(0, fate.current + delta),
    });
  }

  // ------------------------------
  // Danger state helpers
  // ------------------------------
  function woundsDangerClass(value: number) {
    return value <= 3 ? "text-red-400 font-semibold" : "";
  }

  function fateDangerClass(value: number) {
    return value === 0 ? "text-red-400 font-semibold" : "";
  }

  // ------------------------------
  // Clipboard
  // ------------------------------
  async function copyCode() {
    if (!recoveryCode) return;
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  // ------------------------------
  // Movement (auto-calculated)
  // ------------------------------
  const agiTotal = getCharTotal("ag");
  const AB = Math.floor(agiTotal / 10);

  const move = {
    half: AB,
    full: AB * 2,
    charge: AB * 3,
    run: AB * 6,
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
            onChange={(e) =>
              updateHeaderField("characterName", e.target.value)
            }
          />
        </label>
      </section>

      {/* WOUNDS */}
      <section className={sectionContainerClass(editable)}>
        <h2 className="text-lg font-semibold mb-2">Wounds</h2>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">
            Total: <span className="text-slate-200">{wounds.total}</span>
          </span>

          <span className="text-slate-400 ml-3">Current:</span>

          <button
            disabled={!editable}
            onClick={() => adjustWounds(-1)}
            className={`px-2 py-0.5 border rounded text-xs transition
              ${
                editable
                  ? "border-slate-600 hover:bg-slate-800"
                  : "border-slate-700 opacity-50 cursor-not-allowed"
              }`}
          >
            −
          </button>

          <span
            className={`min-w-[2ch] text-center font-mono ${woundsDangerClass(
              wounds.current
            )}`}
          >
            {wounds.current}
          </span>

          <button
            disabled={!editable}
            onClick={() => adjustWounds(1)}
            className={`px-2 py-0.5 border rounded text-xs transition
              ${
                editable
                  ? "border-slate-600 hover:bg-slate-800"
                  : "border-slate-700 opacity-50 cursor-not-allowed"
              }`}
          >
            +
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label className="text-xs text-slate-400">
            Critical Damage
            <input
              type="number"
              disabled={!editable}
              className={editableInputClass(editable) + " mt-1"}
              value={wounds.criticalDamage}
              onChange={(e) =>
                onUpdateWounds({
                  ...wounds,
                  criticalDamage: Number(e.target.value),
                })
              }
            />
          </label>

          <label className="text-xs text-slate-400">
            Fatigue
            <input
              type="number"
              disabled={!editable}
              className={editableInputClass(editable) + " mt-1"}
              value={wounds.fatigue}
              onChange={(e) =>
                onUpdateWounds({
                  ...wounds,
                  fatigue: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
      </section>

      {/* FATE */}
      <section className={sectionContainerClass(editable)}>
        <h2 className="text-lg font-semibold mb-2">Fate Points</h2>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">
            Total: <span className="text-slate-200">{fate.total}</span>
          </span>

          <span className="text-slate-400 ml-3">Current:</span>

          <button
            disabled={!editable}
            onClick={() => adjustFate(-1)}
            className={`px-2 py-0.5 border rounded text-xs transition
              ${
                editable
                  ? "border-slate-600 hover:bg-slate-800"
                  : "border-slate-700 opacity-50 cursor-not-allowed"
              }`}
          >
            −
          </button>

          <span
            className={`min-w-[2ch] text-center font-mono ${fateDangerClass(
              fate.current
            )}`}
          >
            {fate.current}
          </span>

          <button
            disabled={!editable}
            onClick={() => adjustFate(1)}
            className={`px-2 py-0.5 border rounded text-xs transition
              ${
                editable
                  ? "border-slate-600 hover:bg-slate-800"
                  : "border-slate-700 opacity-50 cursor-not-allowed"
              }`}
          >
            +
          </button>
        </div>
      </section>

      {/* MOVEMENT */}
      <section className={sectionContainerClass(false)}>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Movement</h2>
          <Tooltip
            content={
              <>
                <div>AB = Agility ÷ 10</div>
                <div>Half: AB</div>
                <div>Full: AB × 2</div>
                <div>Charge: AB × 3</div>
                <div>Run: AB × 6</div>
              </>
            }
          >
            ⓘ
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>Half: {move.half}</div>
          <div>Full: {move.full}</div>
          <div>Charge: {move.charge}</div>
          <div>Run: {move.run}</div>
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
          className="px-3 py-2 bg-red-600 text-white rounded border border-red-700 hover:bg-red-500 text-sm"
        >
          Release Character
        </button>
      )}
    </div>
  );
}