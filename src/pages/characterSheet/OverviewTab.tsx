// src/pages/characterSheet/OverviewTab.tsx

import { useState } from "react";
import { Tooltip } from "../../components/Tooltip";
import type {
  Character,
  CharacterHeader,
  WoundsBlock,
  FateBlock
} from "../../types/Character";

interface OverviewTabProps {
  character: Character;
  editable: boolean;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;

  // Auto-calculation
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
  getCharTotal
}: OverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const header = character.header;
  const wounds = character.wounds;
  const fate = character.fate;
  const recoveryCode = character.recoveryCode ?? null;

  // ------------------------------
  // Safe update helpers
  // ------------------------------
  function updateHeaderField<K extends keyof CharacterHeader>(
    key: K,
    value: CharacterHeader[K]
  ) {
    onUpdateHeader({ ...header, [key]: value });
  }

  function updateWoundsField<K extends keyof WoundsBlock>(
    key: K,
    value: number
  ) {
    onUpdateWounds({ ...wounds, [key]: value });
  }

  function updateFateField<K extends keyof FateBlock>(key: K, value: number) {
    onUpdateFate({ ...fate, [key]: value });
  }

  async function copyCode() {
    if (!recoveryCode) return;
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  // Input helper component
  function NumInput({
    label,
    value,
    onChange
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) {
    return (
      <label className="text-xs text-slate-400 flex flex-col gap-1">
        {label}
        <input
          type="number"
          disabled={!editable}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100
            ${!editable ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </label>
    );
  }

  // ---------------------------------
  // Movement auto-calculation
  // ---------------------------------
  const agiTotal = getCharTotal("ag");
  const AB = Math.floor(agiTotal / 10);

  const move = {
    half: AB,
    full: AB * 2,
    charge: AB * 3,
    run: AB * 6
  };

  return (
    <div className="space-y-8 text-slate-300">

      {/* HEADER BLOCK */}
      <section className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Character Name
          </label>
          <input
            disabled={!editable}
            className={`w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100`}
            value={header.characterName ?? ""}
            onChange={(e) => updateHeaderField("characterName", e.target.value)}
          />
        </div>

        {/* Header grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Player Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Player Name</label>
            <input
              disabled={!editable}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
              value={header.playerName ?? ""}
              onChange={(e) => updateHeaderField("playerName", e.target.value)}
            />
          </div>

          {/* Career */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Career</label>
            <input
              disabled={!editable}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
              value={header.career ?? ""}
              onChange={(e) => updateHeaderField("career", e.target.value)}
            />
          </div>

          {/* Rank */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Rank</label>
            <input
              disabled={!editable}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
              value={header.rank ?? ""}
              onChange={(e) => updateHeaderField("rank", e.target.value)}
            />
          </div>

          {/* Homeworld */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Homeworld</label>
            <input
              disabled={!editable}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
              value={header.homeWorld ?? ""}
              onChange={(e) => updateHeaderField("homeWorld", e.target.value)}
            />
          </div>

          {/* Divination */}
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Divination</label>
            <input
              disabled={!editable}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
              value={header.divination ?? ""}
              onChange={(e) => updateHeaderField("divination", e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Description</label>
          <textarea
            disabled={!editable}
            className="w-full min-h-[80px] px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 resize-y"
            value={header.description ?? ""}
            onChange={(e) => updateHeaderField("description", e.target.value)}
          />
        </div>
      </section>

      {/* WOUNDS */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Wounds</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumInput label="Total" value={wounds.total} onChange={(v) => updateWoundsField("total", v)} />
          <NumInput label="Current" value={wounds.current} onChange={(v) => updateWoundsField("current", v)} />
          <NumInput label="Critical" value={wounds.criticalDamage} onChange={(v) => updateWoundsField("criticalDamage", v)} />
          <NumInput label="Fatigue" value={wounds.fatigue} onChange={(v) => updateWoundsField("fatigue", v)} />
        </div>
      </section>

      {/* FATE */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Fate Points</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumInput label="Total" value={fate.total} onChange={(v) => updateFateField("total", v)} />
          <NumInput label="Current" value={fate.current} onChange={(v) => updateFateField("current", v)} />
        </div>
      </section>

      {/* MOVEMENT — AUTO CALCULATED */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Movement</h2>

          {/* Tooltip Icon */}
          <Tooltip
            content={
              <>
                <div className="font-semibold mb-1">Movement is auto-calculated:</div>
                <div>AB = Agility Total ÷ 10 (rounded down)</div>
                <div>Half = AB</div>
                <div>Full = AB × 2</div>
                <div>Charge = AB × 3</div>
                <div>Run = AB × 6</div>
              </>
            }
          >
            ⓘ
          </Tooltip>
        </div>

        {/* Movement values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
          <NumInput label="Half" value={move.half} onChange={() => {}} />
          <NumInput label="Full" value={move.full} onChange={() => {}} />
          <NumInput label="Charge" value={move.charge} onChange={() => {}} />
          <NumInput label="Run" value={move.run} onChange={() => {}} />
        </div>
      </section>

      {/* RECOVERY CODE */}
      {recoveryCode && (
        <section className="p-3 rounded border border-slate-700 bg-slate-900/40 space-y-1">
          <div className="text-xs text-slate-400">Recovery Code</div>

          <div className="flex items-center gap-2">
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

      {/* RELEASE BUTTON */}
      {canPlayerRelease && (
        <section>
          <button
            onClick={onPlayerRelease}
            className="px-3 py-2 bg-red-600 text-white rounded border border-red-700 hover:bg-red-500 text-sm"
          >
            Release Character
          </button>
        </section>
      )}
    </div>
  );
}