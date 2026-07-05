// src/pages/characterSheet/CharacteristicsTab.tsx

import { useCallback, useState } from "react";
import type { CharField } from "../../utils/characterFactory";
import type { Characteristics, CorruptionBlock } from "../../types/Character";
import {
  getCharacteristicModifierTotals,
  getCharacteristicModifierSources,
  type CharacteristicModifierSource,
} from "../../features/corruption/characteristicModifierTotals";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import CharacteristicField from "../../components/CharacteristicField";
import { InfoModal } from "../../components/InfoModal";
import {
  CHARACTERISTIC_BONUS_DIVISOR,
  MOVEMENT_HALF_MULTIPLIER,
  MOVEMENT_FULL_MULTIPLIER,
  MOVEMENT_CHARGE_MULTIPLIER,
  MOVEMENT_RUN_MULTIPLIER,
} from "../../constants/gameRules";
import { calculateCharacteristicTotal } from "../../utils/stats";
import {
  uiSection,
  uiCell,
  uiCellLabel,
  uiCellValueSm,
  uiInfoModalWrapper,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";

// ─── StatBlock ────────────────────────────────────────────────────────────────
// Extracted to module level to avoid re-creating the component on every render.

interface StatBlockProps {
  label: string;
  statKey: keyof Characteristics;
  editable: boolean;
  adjustment: number;
  sources: CharacteristicModifierSource[];
  getCharField: (statKey: keyof Characteristics) => CharField;
  updateCharacteristic: (statKey: keyof Characteristics, value: CharField) => void;
}

function StatBlock({
  label,
  statKey,
  editable,
  adjustment,
  sources,
  getCharField,
  updateCharacteristic,
}: StatBlockProps) {
  const value = getCharField(statKey);
  const statTotal = calculateCharacteristicTotal(value.base, value.advances);
  const effectiveTotal = Math.max(1, statTotal + adjustment);

  const handleChange = useCallback(
    (v: CharField) => {
      updateCharacteristic(statKey, v);
    },
    [statKey, updateCharacteristic]
  );

  return (
    <div className={uiSection + " space-y-2"}>
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span className="flex items-center gap-1">
          <span className="text-sm lg:text-base text-slate-100">{label}</span>
          {adjustment !== 0 && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={`${label} Adjustments`}
                content={
                  <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                    {sources.map((source, i) => (
                      <li key={i}>
                        {source.name} ({source.type}): {source.amount > 0 ? "+" : ""}{source.amount}
                      </li>
                    ))}
                  </ul>
                }
              />
            </span>
          )}
        </span>
        <span className="text-xl lg:text-2xl font-semibold font-code text-slate-100">
          {effectiveTotal}
          {adjustment !== 0 && (
            <span className={`ml-1 text-xs lg:text-sm font-code ${adjustment > 0 ? "text-emerald-400" : "text-red-400"}`}>
              ({adjustment > 0 ? "+" : ""}{adjustment})
            </span>
          )}
        </span>
      </div>

      {/* Base / Advances */}
      <CharacteristicField label="" value={value} editable={editable} onChange={handleChange} />
    </div>
  );
}

// ─── CharacteristicsTab ───────────────────────────────────────────────────────

const STAT_KEYS = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"] as const satisfies readonly (keyof Characteristics)[];

const STAT_LABELS: Record<keyof Characteristics, string> = {
  ws: "Weapon Skill (WS)",
  bs: "Ballistic Skill (BS)",
  s: "Strength (S)",
  t: "Toughness (T)",
  ag: "Agility (Ag)",
  int: "Intelligence (Int)",
  per: "Perception (Per)",
  wp: "Willpower (WP)",
  fel: "Fellowship (Fel)",
};

interface CharacteristicsTabProps {
  getCharField: (statKey: keyof Characteristics) => CharField;
  getCharTotal: (statKey: keyof Characteristics) => number;
  editable: boolean;
  corruption: CorruptionBlock;
  updateCharacteristic: (statKey: keyof Characteristics, value: CharField) => void;
}

export function CharacteristicsTab({
  getCharField,
  getCharTotal,
  editable,
  corruption,
  updateCharacteristic,
}: CharacteristicsTabProps) {
  const modifierTotals = getCharacteristicModifierTotals(corruption);
  const [activeStat, setActiveStatRaw] = useState<keyof Characteristics>("ws");
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const setActiveStat = useCallback((next: keyof Characteristics) => {
    setActiveStatRaw((current) => {
      if (next === current) return current;
      const isForward = STAT_KEYS.indexOf(next) === (STAT_KEYS.indexOf(current) + 1) % STAT_KEYS.length;
      setSlideDirection(isForward ? 1 : -1);
      return next;
    });
  }, []);
  const { containerRef, transition } = useSwipeableTabs(STAT_KEYS, activeStat, setActiveStat);

  function effectiveTotal(rawTotal: number, key: keyof Characteristics): number {
    return Math.max(1, rawTotal + (modifierTotals[key] ?? 0));
  }

  const SB = Math.floor(effectiveTotal(getCharTotal("s"), "s") / CHARACTERISTIC_BONUS_DIVISOR);
  const TB = Math.floor(effectiveTotal(getCharTotal("t"), "t") / CHARACTERISTIC_BONUS_DIVISOR);
  const AB = Math.floor(effectiveTotal(getCharTotal("ag"), "ag") / CHARACTERISTIC_BONUS_DIVISOR);
  const IB = Math.floor(effectiveTotal(getCharTotal("int"), "int") / CHARACTERISTIC_BONUS_DIVISOR);
  const PB = Math.floor(effectiveTotal(getCharTotal("per"), "per") / CHARACTERISTIC_BONUS_DIVISOR);
  const WPB = Math.floor(effectiveTotal(getCharTotal("wp"), "wp") / CHARACTERISTIC_BONUS_DIVISOR);
  const FB = Math.floor(effectiveTotal(getCharTotal("fel"), "fel") / CHARACTERISTIC_BONUS_DIVISOR);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Stats */}
      <div>
        <SectionHeader className="mb-2">Stats</SectionHeader>
        <div className="grid grid-cols-9 gap-1">
          {(
            [
              { label: "WS", key: "ws" },
              { label: "BS", key: "bs" },
              { label: "S", key: "s" },
              { label: "T", key: "t" },
              { label: "Ag", key: "ag" },
              { label: "Int", key: "int" },
              { label: "Per", key: "per" },
              { label: "WP", key: "wp" },
              { label: "Fel", key: "fel" },
            ] as { label: string; key: keyof Characteristics }[]
          ).map(({ label, key }) => (
            <div key={key} className={`${uiCell} text-center py-1 lg:py-1.5 px-0.5 lg:px-1`}>
              <div className={uiCellLabel}>{label}</div>
              <div className={uiCellValueSm}>{effectiveTotal(getCharTotal(key), key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Characteristic Bonuses */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SectionHeader>Characteristic Bonuses</SectionHeader>
          <span className={uiInfoModalWrapper}>
            <InfoModal
              title="Characteristic Bonuses"
              content={
                <div>Each Bonus = its Characteristic ÷ {CHARACTERISTIC_BONUS_DIVISOR}, rounded down.</div>
              }
            />
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[
            { label: "SB", value: SB },
            { label: "TB", value: TB },
            { label: "AB", value: AB },
            { label: "IB", value: IB },
            { label: "PB", value: PB },
            { label: "WPB", value: WPB },
            { label: "FB", value: FB },
          ].map(({ label, value }) => (
            <div key={label} className={`${uiCell} text-center py-1 lg:py-1.5 px-0.5 lg:px-1`}>
              <div className={uiCellLabel}>{label}</div>
              <div className={uiCellValueSm}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Movement */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SectionHeader>Movement</SectionHeader>
          <span className={uiInfoModalWrapper}>
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
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Half", value: AB },
            { label: "Full", value: AB * MOVEMENT_FULL_MULTIPLIER },
            { label: "Charge", value: AB * MOVEMENT_CHARGE_MULTIPLIER },
            { label: "Run", value: AB * MOVEMENT_RUN_MULTIPLIER },
          ].map(({ label, value }) => (
            <div key={label} className={`${uiCell} text-center py-1 lg:py-1.5 px-0.5 lg:px-1`}>
              <div className={uiCellLabel}>{label}</div>
              <div className={uiCellValueSm}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main stats — mobile swiper */}
      <div ref={containerRef} className="lg:hidden">
        <section
          key={activeStat}
          className={`relative px-5 transition-all duration-150 ease-out motion-reduce:transition-none ${
            transition === "sliding"
              ? slideDirection === 1
                ? "opacity-0 translate-x-3"
                : "opacity-0 -translate-x-3"
              : "opacity-100 translate-x-0"
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold leading-none text-slate-500"
          >
            ‹
          </span>
          <StatBlock
            label={STAT_LABELS[activeStat]}
            statKey={activeStat}
            editable={editable}
            adjustment={modifierTotals[activeStat] ?? 0}
            sources={getCharacteristicModifierSources(corruption, activeStat)}
            getCharField={getCharField}
            updateCharacteristic={updateCharacteristic}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-2xl font-bold leading-none text-slate-500"
          >
            ›
          </span>
        </section>
      </div>

      {/* Main stats — desktop grid */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        {STAT_KEYS.map((key) => (
          <StatBlock
            key={key}
            label={STAT_LABELS[key]}
            statKey={key}
            editable={editable}
            adjustment={modifierTotals[key] ?? 0}
            sources={getCharacteristicModifierSources(corruption, key)}
            getCharField={getCharField}
            updateCharacteristic={updateCharacteristic}
          />
        ))}
      </div>
    </div>
  );
}
