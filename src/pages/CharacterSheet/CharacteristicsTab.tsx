// src/pages/CharacterSheet/CharacteristicsTab.tsx

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CharField } from "../../types/Character";
import type { Characteristics, CorruptionBlock, TalentsAndTraitsBlock } from "../../types/Character";
import {
  getCharacteristicModifierTotals,
  getCharacteristicModifierSources,
  type CharacteristicModifierSource,
} from "../../mechanics/corruption/characteristicModifierTotals";
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
  CHARACTERISTIC_ADVANCE_TIERS,
  getCharacteristicTierCosts,
} from "../../mechanics/experience/characteristicAdvanceCosts";
import { makeCurrentRankPurchase } from "../../mechanics/experience/purchaseAttribution";
import {
  uiSection,
  uiCell,
  uiCellLabel,
  uiCellValueSm,
  uiInfoModalWrapper,
} from "../../ui/styles/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { getTraitMovementEffects, getWaryInitiativeBonus } from "../../mechanics/traits/traitEffects";

// ─── StatBlock ────────────────────────────────────────────────────────────────
// Extracted to module level to avoid re-creating the component on every render.

interface StatBlockProps {
  label: string;
  statKey: keyof Characteristics;
  editable: boolean;
  adjustment: number;
  sources: CharacteristicModifierSource[];
  tierCosts: (number | null | undefined)[];
  getCharField: (statKey: keyof Characteristics) => CharField;
  updateCharacteristic: (statKey: keyof Characteristics, value: CharField) => void;
}

function StatBlock({
  label,
  statKey,
  editable,
  adjustment,
  sources,
  tierCosts,
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
      <CharacteristicField
        label={label}
        hideLabel
        value={value}
        editable={editable}
        onChange={handleChange}
        tierCosts={tierCosts}
      />
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

const PEEK_PX = 32;
const GAP_PX = 12;
const COMMIT_FRACTION = 0.25;
const SETTLE_DURATION_MS = 220;

interface CharacteristicsTabProps {
  getCharField: (statKey: keyof Characteristics) => CharField;
  getEffectiveCharTotal: (statKey: keyof Characteristics) => number;
  getCharBonus: (statKey: keyof Characteristics) => number;
  editable: boolean;
  corruption: CorruptionBlock;
  talents?: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  updateCharacteristic: (statKey: keyof Characteristics, value: CharField) => void;
}

export function CharacteristicsTab({
  getCharField,
  getEffectiveCharTotal,
  getCharBonus,
  editable,
  corruption,
  talents,
  career,
  rank,
  updateCharacteristic,
}: CharacteristicsTabProps) {
  const modifierTotals = getCharacteristicModifierTotals(corruption, talents, career);
  const [activeStat, setActiveStat] = useState<keyof Characteristics>("ws");
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ startX: number; startY: number; isHorizontal: boolean | null } | null>(null);
  const dragOffsetRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const pendingCompleteRef = useRef<(() => void) | null>(null);

  const activeIndex = STAT_KEYS.indexOf(activeStat);
  const prevStat = STAT_KEYS[(activeIndex - 1 + STAT_KEYS.length) % STAT_KEYS.length];
  const nextStat = STAT_KEYS[(activeIndex + 1) % STAT_KEYS.length];

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const slideWidth = Math.max(0, containerWidth - 2 * PEEK_PX);
  const restingOffset = PEEK_PX - slideWidth - GAP_PX;

  const applyTransform = useCallback(
    (offset: number) => {
      dragOffsetRef.current = offset;
      const track = trackRef.current;
      if (track) track.style.transform = `translateX(${restingOffset + offset}px)`;
    },
    [restingOffset]
  );

  useLayoutEffect(() => {
    applyTransform(0);
  }, [activeStat, applyTransform]);

  const cancelSettleAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    pendingCompleteRef.current = null;
  }, []);

  const finishPendingCommit = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    const complete = pendingCompleteRef.current;
    pendingCompleteRef.current = null;
    complete?.();
  }, []);

  const animateTo = useCallback(
    (target: number, onComplete?: () => void) => {
      finishPendingCommit();
      const start = dragOffsetRef.current;
      const distance = target - start;
      if (distance === 0) {
        onComplete?.();
        return;
      }
      pendingCompleteRef.current = onComplete ?? null;
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / SETTLE_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        applyTransform(start + distance * eased);
        if (t < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          animationRef.current = null;
          const complete = pendingCompleteRef.current;
          pendingCompleteRef.current = null;
          complete?.();
        }
      };
      animationRef.current = requestAnimationFrame(step);
    },
    [applyTransform, finishPendingCommit]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element || slideWidth === 0) return;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const rect = element.getBoundingClientRect();
      if (touch.clientY < rect.top || touch.clientY > rect.bottom) return;
      finishPendingCommit();
      touchRef.current = { startX: touch.clientX, startY: touch.clientY, isHorizontal: null };
    };

    const onTouchMove = (event: TouchEvent) => {
      const state = touchRef.current;
      if (!state) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      if (state.isHorizontal === null) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
        state.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      }
      if (state.isHorizontal) {
        event.preventDefault();
        applyTransform(deltaX);
      }
    };

    const onTouchEnd = () => {
      const state = touchRef.current;
      touchRef.current = null;
      if (!state?.isHorizontal) {
        animateTo(0);
        return;
      }
      const current = dragOffsetRef.current;
      if (Math.abs(current) > slideWidth * COMMIT_FRACTION) {
        const direction = current < 0 ? 1 : -1;
        animateTo(Math.sign(current) * (slideWidth + GAP_PX), () => {
          setActiveStat((currentStat) => {
            const currentIndex = STAT_KEYS.indexOf(currentStat);
            return STAT_KEYS[(currentIndex + direction + STAT_KEYS.length) % STAT_KEYS.length];
          });
        });
      } else {
        animateTo(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [slideWidth, applyTransform, animateTo, finishPendingCommit]);

  useEffect(() => cancelSettleAnimation, [cancelSettleAnimation]);

  const SB = getCharBonus("s");
  const TB = getCharBonus("t");
  const AB = getCharBonus("ag");
  const IB = getCharBonus("int");
  const PB = getCharBonus("per");
  const WPB = getCharBonus("wp");
  const FB = getCharBonus("fel");
  const baseMovementAB = Math.floor(getEffectiveCharTotal("ag") / CHARACTERISTIC_BONUS_DIVISOR);
  const movementEffects = talents
    ? getTraitMovementEffects(talents, baseMovementAB, career)
    : { agilityBonus: baseMovementAB, sources: [], modes: [] };
  const movementAB = movementEffects.agilityBonus;
  const waryInitiative = talents ? getWaryInitiativeBonus(talents, career) : 0;

  const updateCharacteristicWithPurchase = useCallback(
    (statKey: keyof Characteristics, next: CharField) => {
      const current = getCharField(statKey);
      const purchases = { ...current.advancePurchases };
      const tierCosts = getCharacteristicTierCosts(career, statKey);

      if (next.advances > current.advances) {
        for (let index = current.advances; index < next.advances; index += 1) {
          const tier = CHARACTERISTIC_ADVANCE_TIERS[index];
          const cost = tierCosts[index];
          if (tier && typeof cost === "number") {
            purchases[tier] = makeCurrentRankPurchase(career, rank, cost);
          }
        }
      } else if (next.advances < current.advances) {
        for (let index = next.advances; index < CHARACTERISTIC_ADVANCE_TIERS.length; index += 1) {
          delete purchases[CHARACTERISTIC_ADVANCE_TIERS[index]];
        }
      }

      updateCharacteristic(
        statKey,
        Object.keys(purchases).length > 0
          ? { ...next, advancePurchases: purchases }
          : next
      );
    },
    [career, getCharField, rank, updateCharacteristic]
  );

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
              <div className={uiCellValueSm}>{getEffectiveCharTotal(key)}</div>
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
                  <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                    During a Round, characters may move at one of four speeds: Half Move, Full Move,
                    Charge, or Run. The number of metres a character may move in his Turn is
                    determined by his Agility Bonus. Traits can modify some or all movement speeds.
                  </p>
                  <div className="mt-2 space-y-1">
                    <div>AB = Agility ÷ {CHARACTERISTIC_BONUS_DIVISOR}</div>
                    <div>Half: AB × {MOVEMENT_HALF_MULTIPLIER}</div>
                    <div>Full: AB × {MOVEMENT_FULL_MULTIPLIER}</div>
                    <div>Charge: AB × {MOVEMENT_CHARGE_MULTIPLIER}</div>
                    <div>Run: AB × {MOVEMENT_RUN_MULTIPLIER}</div>
                  </div>
                  {movementEffects.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="font-semibold text-slate-100">Movement effects</div>
                      <ul className="mt-1 space-y-1">
                        {movementEffects.sources.map((source, i) => (
                          <li key={i}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {waryInitiative > 0 && (
                    <div>Initiative: +{waryInitiative} from Wary.</div>
                  )}
                </>
              }
            />
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Half", value: movementAB },
            { label: "Full", value: movementAB * MOVEMENT_FULL_MULTIPLIER },
            { label: "Charge", value: movementAB * MOVEMENT_CHARGE_MULTIPLIER },
            { label: "Run", value: movementAB * MOVEMENT_RUN_MULTIPLIER },
          ].map(({ label, value }) => (
            <div key={label} className={`${uiCell} text-center py-1 lg:py-1.5 px-0.5 lg:px-1`}>
              <div className={uiCellLabel}>{label}</div>
              <div className={uiCellValueSm}>{value}</div>
            </div>
          ))}
        </div>
        {movementEffects.modes.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              {movementEffects.modes.map((mode) => (
                <div key={`${mode.name}:${mode.source}`} className={`${uiCell} text-center py-1.5 px-2`}>
                  <div className={uiCellLabel}>{mode.name}</div>
                  <div className={uiCellValueSm}>{mode.speed}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main stats — mobile swiper */}
      <div ref={containerRef} className="lg:hidden overflow-x-hidden py-3">
        <div ref={trackRef} className="flex" style={{ transform: `translateX(${restingOffset}px)` }}>
          <div
            aria-hidden="true"
            className="pointer-events-none opacity-50"
            style={{ flex: `0 0 ${slideWidth}px`, minWidth: 0, marginRight: GAP_PX }}
          >
            <StatBlock
              key={prevStat}
              label={STAT_LABELS[prevStat]}
              statKey={prevStat}
              editable={false}
              adjustment={modifierTotals[prevStat] ?? 0}
              sources={getCharacteristicModifierSources(corruption, prevStat, talents, career)}
              tierCosts={getCharacteristicTierCosts(career, prevStat)}
              getCharField={getCharField}
              updateCharacteristic={updateCharacteristicWithPurchase}
            />
          </div>
          <div className="rounded-lg shadow-[0_0_10px_1px_rgba(203,213,225,0.25)]" style={{ flex: `0 0 ${slideWidth}px`, minWidth: 0, marginRight: GAP_PX }}>
            <StatBlock
              key={activeStat}
              label={STAT_LABELS[activeStat]}
              statKey={activeStat}
              editable={editable}
              adjustment={modifierTotals[activeStat] ?? 0}
              sources={getCharacteristicModifierSources(corruption, activeStat, talents, career)}
              tierCosts={getCharacteristicTierCosts(career, activeStat)}
              getCharField={getCharField}
              updateCharacteristic={updateCharacteristicWithPurchase}
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none opacity-50"
            style={{ flex: `0 0 ${slideWidth}px`, minWidth: 0 }}
          >
            <StatBlock
              key={nextStat}
              label={STAT_LABELS[nextStat]}
              statKey={nextStat}
              editable={false}
              adjustment={modifierTotals[nextStat] ?? 0}
              sources={getCharacteristicModifierSources(corruption, nextStat, talents, career)}
              tierCosts={getCharacteristicTierCosts(career, nextStat)}
              getCharField={getCharField}
              updateCharacteristic={updateCharacteristicWithPurchase}
            />
          </div>
        </div>
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
            sources={getCharacteristicModifierSources(corruption, key, talents, career)}
            tierCosts={getCharacteristicTierCosts(career, key)}
            getCharField={getCharField}
              updateCharacteristic={updateCharacteristicWithPurchase}
          />
        ))}
      </div>
    </div>
  );
}
