// src/pages/characterSheet/CharacteristicsTab.tsx

import { useCallback } from "react";
import type { CharField } from "../../utils/characterFactory";
import type { Characteristics } from "../../types/Character";
import CharacteristicField from "../../components/CharacteristicField";
import { sectionContainerClass } from "../../ui/editableStyles";
import {
  CHARACTERISTIC_BONUS_DIVISOR,
  MOVEMENT_FULL_MULTIPLIER,
  MOVEMENT_CHARGE_MULTIPLIER,
  MOVEMENT_RUN_MULTIPLIER,
} from "../../constants/gameRules";
import { calculateCharacteristicTotal } from "../../utils/stats";

// ─── StatBlock ────────────────────────────────────────────────────────────────
// Extracted to module level to avoid re-creating the component on every render.

interface StatBlockProps {
  label: string;
  statKey: keyof Characteristics;
  editable: boolean;
  getCharField: (statKey: keyof Characteristics) => CharField;
  updateCharacteristic: (statKey: keyof Characteristics, value: CharField) => void;
}

function StatBlock({
  label,
  statKey,
  editable,
  getCharField,
  updateCharacteristic,
}: StatBlockProps) {
  const value = getCharField(statKey);
  const statTotal = calculateCharacteristicTotal(value.base, value.advances);

  const handleChange = useCallback((v: CharField) => {
    updateCharacteristic(statKey, v);
  }, [statKey, updateCharacteristic]);

  return (
    <div className={sectionContainerClass(editable) + " space-y-2"}>
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-2xl font-semibold font-mono text-slate-100">
          {statTotal}
        </span>
      </div>

      {/* Base / Advances */}
      <CharacteristicField
        label=""
        value={value}
        editable={editable}
        onChange={handleChange}
      />
    </div>
  );
}

// ─── CharacteristicsTab ───────────────────────────────────────────────────────

interface CharacteristicsTabProps {
  getCharField: (statKey: keyof Characteristics) => CharField;
  getCharTotal: (statKey: keyof Characteristics) => number;
  editable: boolean;
  updateCharacteristic: (
    statKey: keyof Characteristics,
    value: CharField
  ) => void;
}

export function CharacteristicsTab({
  getCharField,
  getCharTotal,
  editable,
  updateCharacteristic,
}: CharacteristicsTabProps) {
  const SB  = Math.floor(getCharTotal("s")   / CHARACTERISTIC_BONUS_DIVISOR);
  const TB  = Math.floor(getCharTotal("t")   / CHARACTERISTIC_BONUS_DIVISOR);
  const AB  = Math.floor(getCharTotal("ag")  / CHARACTERISTIC_BONUS_DIVISOR);
  const IB  = Math.floor(getCharTotal("int") / CHARACTERISTIC_BONUS_DIVISOR);
  const PB  = Math.floor(getCharTotal("per") / CHARACTERISTIC_BONUS_DIVISOR);
  const WPB = Math.floor(getCharTotal("wp")  / CHARACTERISTIC_BONUS_DIVISOR);
  const FB  = Math.floor(getCharTotal("fel") / CHARACTERISTIC_BONUS_DIVISOR);

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Characteristics</h2>

      {/* QUICK VIEW */}
      <section className={sectionContainerClass(false)}>
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Quick View</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {(
            [
              { label: "WS",  key: "ws"  },
              { label: "BS",  key: "bs"  },
              { label: "S",   key: "s"   },
              { label: "T",   key: "t"   },
              { label: "Ag",  key: "ag"  },
              { label: "Int", key: "int" },
              { label: "Per", key: "per" },
              { label: "WP",  key: "wp"  },
              { label: "Fel", key: "fel" },
            ] as { label: string; key: keyof Characteristics }[]
          ).map(({ label, key }) => (
            <div key={key} className={sectionContainerClass(false) + " text-center"}>
              <div className="text-xs text-slate-400 mb-1">{label}</div>
              <div className="text-2xl font-semibold font-mono text-slate-100">
                {getCharTotal(key)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock label="Weapon Skill (WS)"   statKey="ws"  editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Ballistic Skill (BS)" statKey="bs"  editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Strength (S)"         statKey="s"   editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Toughness (T)"        statKey="t"   editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Agility (Ag)"         statKey="ag"  editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Intelligence (Int)"   statKey="int" editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Perception (Per)"     statKey="per" editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Willpower (WP)"       statKey="wp"  editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
        <StatBlock label="Fellowship (Fel)"     statKey="fel" editable={editable} getCharField={getCharField} updateCharacteristic={updateCharacteristic} />
      </div>

      {/* Derived stats */}
      <section className={sectionContainerClass(false) + " space-y-4"}>
        <h3 className="text-lg font-semibold">Derived Stats</h3>

        {/* Characteristic Bonuses */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Characteristic Bonuses</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[
              { label: "SB",  value: SB },
              { label: "TB",  value: TB },
              { label: "AB",  value: AB },
              { label: "IB",  value: IB },
              { label: "PB",  value: PB },
              { label: "WPB", value: WPB },
              { label: "FB",  value: FB },
            ].map(({ label, value }) => (
              <div key={label} className={sectionContainerClass(false) + " text-center"}>
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className="text-2xl font-semibold font-mono text-slate-100">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Movement */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Movement</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Half",   value: AB },
              { label: "Full",   value: AB * MOVEMENT_FULL_MULTIPLIER },
              { label: "Charge", value: AB * MOVEMENT_CHARGE_MULTIPLIER },
              { label: "Run",    value: AB * MOVEMENT_RUN_MULTIPLIER },
            ].map(({ label, value }) => (
              <div key={label} className={sectionContainerClass(false) + " text-center"}>
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className="text-2xl font-semibold font-mono text-slate-100">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}