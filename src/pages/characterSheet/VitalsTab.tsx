// src/pages/characterSheet/VitalsTab.tsx

import { useCallback, useState } from "react";
import { Stepper } from "../../components/Stepper";
import { InfoModal } from "../../components/InfoModal";
import type {
  Character,
  WoundsBlock,
  FateBlock,
  TalentsAndTraitsBlock,
} from "../../types/Character";
import { getTalentFateEffects, getTalentWoundModifierSources } from "../../features/talents/talentEffects";
import {
  uiSection,
  uiCell,
  uiCellValue,
  uiInfoModalWrapper,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { WOUNDS_CRITICAL_THRESHOLD, FATE_CRITICAL_THRESHOLD } from "../../constants/gameRules";

const VITALS_RULE_TEXT = {
  criticalDamage:
    "Any Damage taken in excess of a character's Wounds counts as Critical Damage. When this occurs, immediately consult the table that corresponds with the location (arm, body, etc.) and the type of attack (Energy, Explosive, Impact or Rending). The Critical Damage total determines the severity of the injury to the location. Should the character survive, the Critical Damage still remains. If the same character takes Damage again, the Critical Damage is added to the existing Damage and the cumulative Damage total is used to determine the new Critical Effect.",
  fatigue:
    "Not all Damage is lethal in Dark Heresy. Exhaustion, combat trauma or swapping licks with bare fists can all leave a character battered, but more or less intact. Fatigue measures the amount of non-lethal Damage a character can take over the course of game play. Characters gain Fatigue from certain types of attacks, Grappling, forced marching and other Actions which push them beyond safe limits. A character can take a number of levels of Fatigue equal to his Toughness Bonus, so a character with a four Toughness Bonus can take four levels of Fatigue. Should a character take a number of levels of Fatigue in excess of his Toughness Bonus, he collapses, unconscious for 10-TB minutes. Characters suffering from Fatigue are at a -10 penalty to all Tests.",
};

interface VitalsTabProps {
  character: Character;
  editable: boolean;
  toughnessBonus: number;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;
  talents?: TalentsAndTraitsBlock;
}

const totalInputClass =
  "w-full rounded border px-2 lg:px-3 py-1.5 lg:py-2 text-center text-xl lg:text-2xl font-semibold font-code transition bg-slate-900 border-slate-500 text-slate-200 focus:outline-none focus:border-red-500";

export function VitalsTab({
  character,
  editable,
  toughnessBonus,
  onUpdateWounds,
  onUpdateFate,
  talents,
}: VitalsTabProps) {
  const { wounds, fate } = character;
  const woundSources = talents ? getTalentWoundModifierSources(talents) : [];
  const woundAdjustment = woundSources.reduce((total, source) => total + source.amount, 0);
  const effectiveWoundsTotal = Math.max(1, wounds.total + woundAdjustment);
  const fateEffects = talents ? getTalentFateEffects(talents) : { modifierSources: [] };
  const fateAdjustment = fateEffects.modifierSources.reduce((total, source) => total + source.amount, 0);
  const effectiveFateTotal = Math.max(
    0,
    (fateEffects.overrideTotal ?? fate.total) + fateAdjustment
  );

  const [woundsTotalDraft, setWoundsTotalDraft] = useState<string | null>(null);
  const [fateTotalDraft, setFateTotalDraft] = useState<string | null>(null);

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        setWoundsTotalDraft(raw);
        return;
      }
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n >= 1) {
        setWoundsTotalDraft(null);
        onUpdateWounds({ ...wounds, total: n });
      }
    },
    [wounds, onUpdateWounds]
  );

  const handleCurrentFateChange = useCallback(
    (v: number) => onUpdateFate({ ...fate, current: v }),
    [fate, onUpdateFate]
  );
  const handleFateTotalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        setFateTotalDraft(raw);
        return;
      }
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n >= 0) {
        setFateTotalDraft(null);
        onUpdateFate({ ...fate, total: n });
      }
    },
    [fate, onUpdateFate]
  );

  function dangerClass(value: number, criticalThreshold: number): string {
    return value <= criticalThreshold ? "text-red-400 font-semibold" : "";
  }

  function dangerClassAbove(value: number, threshold: number): string {
    return value > threshold ? "text-red-400 font-semibold" : "";
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <SectionHeader className="mb-2">Combat Status</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="flex items-center justify-center gap-1 text-xs lg:text-base text-slate-100 mb-2">
                <span>Total Wounds</span>
                {woundSources.length > 0 && (
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title="Total Wounds Adjustments"
                      content={
                        <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                          {woundSources.map((source, index) => (
                            <li key={index}>
                              {source.name} (Talent): {source.amount > 0 ? "+" : ""}{source.amount}
                            </li>
                          ))}
                        </ul>
                      }
                    />
                  </span>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {editable ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    className={totalInputClass}
                    value={woundsTotalDraft ?? (Number.isFinite(wounds.total) && wounds.total >= 1 ? String(wounds.total) : "")}
                    onChange={handleWoundsTotalChange}
                    onBlur={() => setWoundsTotalDraft(null)}
                    onFocus={(e) => e.target.select()}
                    placeholder="1+"
                    aria-label="Total wounds"
                  />
                ) : (
                  <div className={uiCellValue}>{effectiveWoundsTotal}</div>
                )}
                {editable && woundAdjustment !== 0 && (
                  <span className={`ml-1 text-xs font-code ${woundAdjustment > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    = {effectiveWoundsTotal} ({woundAdjustment > 0 ? "+" : ""}{woundAdjustment})
                  </span>
                )}
              </div>
            </div>

            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Current Wounds</div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={wounds.current}
                  max={effectiveWoundsTotal}
                  editable={editable}
                  onChange={handleCurrentWoundsChange}
                  dangerClassName={dangerClass(wounds.current, WOUNDS_CRITICAL_THRESHOLD)}
                />
              </div>
            </div>

            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-xs lg:text-base text-slate-100">Critical Damage</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title="Critical Damage"
                    content={
                      <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                        {VITALS_RULE_TEXT.criticalDamage}
                      </p>
                    }
                  />
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={wounds.criticalDamage}
                  editable={editable}
                  onChange={handleCriticalDamageChange}
                />
              </div>
            </div>

            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-xs lg:text-base text-slate-100">Fatigue</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title="Fatigue"
                    content={
                      <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                        {VITALS_RULE_TEXT.fatigue}
                      </p>
                    }
                  />
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={wounds.fatigue}
                  editable={editable}
                  onChange={handleFatigueChange}
                  dangerClassName={dangerClassAbove(wounds.fatigue, toughnessBonus)}
                />
              </div>
              {wounds.fatigue > toughnessBonus && (
                <div className="text-xs text-red-400 font-semibold mt-1">Unconscious</div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <SectionHeader>Fate Points</SectionHeader>
          <span className={uiInfoModalWrapper}>
            <InfoModal
              title="Using Fate Points"
              content={
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                    Fate Points allow you to turn luck to your advantage, hitting with that bolter shot when you would have otherwise missed, or cracking the security code on a door just in time to make a hasty escape. Using these twists of fate, you can take a few more risks, which makes the game faster and far more exciting than would otherwise be the case.
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                    That said, you have a limited pool of Fate Points and whenever you spend a Fate Point, you reduce your pool by one, so choose wisely. Fate Points are restored at the start of the next gaming session. Spending a Fate Point allows a character to do one of the following things:
                  </p>
                  <ul className="list-disc list-inside text-sm leading-relaxed text-slate-300 lg:text-base space-y-1">
                    <li>Re-roll any one failed Test. The results of the re-roll are final.</li>
                    <li>Count as having rolled a 10 for their Initiative.</li>
                    <li>Add an extra degree of success to a Test.</li>
                    <li>Instantly recover 1d5 Wounds.</li>
                    <li>Recover from being Stunned.</li>
                  </ul>
                </div>
              }
            />
          </span>
        </div>
        <section className={uiSection}>
          <div className="grid grid-cols-2 gap-3">
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="flex items-center justify-center gap-1 text-xs lg:text-base text-slate-100 mb-2">
                <span>Total</span>
                {(fateEffects.overrideSource || fateEffects.modifierSources.length > 0) && (
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title="Total Fate Point Adjustments"
                      content={
                        <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                          {fateEffects.overrideSource && (
                            <li>{fateEffects.overrideSource} (Talent): set to {fateEffects.overrideTotal}</li>
                          )}
                          {fateEffects.modifierSources.map((source, index) => (
                            <li key={index}>{source.name} (Talent): {source.amount > 0 ? "+" : ""}{source.amount}</li>
                          ))}
                        </ul>
                      }
                    />
                  </span>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {editable ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    className={totalInputClass}
                    value={fateTotalDraft ?? String(fate.total)}
                    onChange={handleFateTotalChange}
                    onBlur={() => setFateTotalDraft(null)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0+"
                    aria-label="Total fate points"
                  />
                ) : (
                  <div className={uiCellValue}>{effectiveFateTotal}</div>
                )}
                {editable && effectiveFateTotal !== fate.total && (
                  <span className="ml-1 text-xs font-code text-emerald-400">= {effectiveFateTotal}</span>
                )}
              </div>
            </div>

            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Current</div>
              <div className="flex-1 flex items-center justify-center">
                <Stepper
                  value={fate.current}
                  max={effectiveFateTotal}
                  editable={editable}
                  onChange={handleCurrentFateChange}
                  dangerClassName={dangerClass(fate.current, FATE_CRITICAL_THRESHOLD)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
