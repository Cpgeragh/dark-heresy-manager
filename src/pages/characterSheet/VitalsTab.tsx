// src/pages/characterSheet/VitalsTab.tsx

import { useCallback, useState } from "react";
import { Stepper } from "../../components/Stepper";
import type {
  Character,
  WoundsBlock,
  FateBlock,
} from "../../types/Character";
import {
  uiSection,
  uiCell,
  uiCellValue,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { WOUNDS_CRITICAL_THRESHOLD, FATE_CRITICAL_THRESHOLD } from "../../constants/gameRules";

interface VitalsTabProps {
  character: Character;
  editable: boolean;
  onUpdateWounds: (next: WoundsBlock) => void;
  onUpdateFate: (next: FateBlock) => void;
}

const totalInputClass =
  "w-full rounded border px-2 lg:px-3 py-1.5 lg:py-2 text-center text-xl lg:text-2xl font-semibold font-code transition bg-slate-900 border-slate-500 text-slate-200 focus:outline-none focus:border-red-500";

export function VitalsTab({
  character,
  editable,
  onUpdateWounds,
  onUpdateFate,
}: VitalsTabProps) {
  const { wounds, fate } = character;

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

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <SectionHeader className="mb-2">Combat Status</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Total Wounds</div>
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
                  <div className={uiCellValue}>{wounds.total}</div>
                )}
              </div>
            </div>

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

      <div>
        <SectionHeader className="mb-2">Fate Points</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-2 gap-3">
            <div className={uiCell + " text-center p-2 lg:p-3 flex flex-col"}>
              <div className="text-xs lg:text-base text-slate-100 mb-2">Total</div>
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
                  <div className={uiCellValue}>{fate.total}</div>
                )}
              </div>
            </div>

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
    </div>
  );
}
