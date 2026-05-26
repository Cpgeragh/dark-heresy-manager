// src/pages/characterSheet/CharacteristicsTab.tsx

import { useCallback } from "react";
import type { CharField } from "../../utils/characterFactory";
import type { Characteristics } from "../../types/Character";
import CharacteristicField from "../../components/CharacteristicField";
import { sectionContainerClass } from "../../ui/editableStyles";
import { 
  CHARACTERISTIC_BONUS_DIVISOR,
  CHARACTERISTIC_ADVANCE_INCREMENT
} from "../../constants/gameRules";

interface CharacteristicsTabProps {
  getCharField: (statKey: keyof Characteristics) => CharField;
  editable: boolean;
  updateCharacteristic: (
    statKey: keyof Characteristics,
    value: CharField
  ) => void;
}

export function CharacteristicsTab({
  getCharField,
  editable,
  updateCharacteristic,
}: CharacteristicsTabProps) {
  // Authoritative total
  function total(stat: keyof Characteristics) {
    const v = getCharField(stat);
    return v.base + v.advances * CHARACTERISTIC_ADVANCE_INCREMENT;
  }

  // Derived bonuses
  const SB = Math.floor(total("s") / CHARACTERISTIC_BONUS_DIVISOR);
  const TB = Math.floor(total("t") / CHARACTERISTIC_BONUS_DIVISOR);
  const AgB = Math.floor(total("ag") / CHARACTERISTIC_BONUS_DIVISOR);
  const IB = Math.floor(total("int") / CHARACTERISTIC_BONUS_DIVISOR);
  const PB = Math.floor(total("per") / CHARACTERISTIC_BONUS_DIVISOR);
  const WPB = Math.floor(total("wp") / CHARACTERISTIC_BONUS_DIVISOR);
  const FB = Math.floor(total("fel") / CHARACTERISTIC_BONUS_DIVISOR);

  function StatBlock({
    label,
    statKey,
  }: {
    label: string;
    statKey: keyof Characteristics;
  }) {
    const value = getCharField(statKey);
    const statTotal = value.base + value.advances * CHARACTERISTIC_ADVANCE_INCREMENT;

    const handleChange = useCallback((v: CharField) => {
      updateCharacteristic(statKey, v);
    }, [statKey]);

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
                {total(key)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock label="Weapon Skill (WS)" statKey="ws" />
        <StatBlock label="Ballistic Skill (BS)" statKey="bs" />
        <StatBlock label="Strength (S)" statKey="s" />
        <StatBlock label="Toughness (T)" statKey="t" />
        <StatBlock label="Agility (Ag)" statKey="ag" />
        <StatBlock label="Intelligence (Int)" statKey="int" />
        <StatBlock label="Perception (Per)" statKey="per" />
        <StatBlock label="Willpower (WP)" statKey="wp" />
        <StatBlock label="Fellowship (Fel)" statKey="fel" />
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
              { label: "AgB", value: AgB },
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
              { label: "Half",   value: AgB },
              { label: "Full",   value: AgB * 2 },
              { label: "Charge", value: AgB * 3 },
              { label: "Run",    value: AgB * 6 },
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