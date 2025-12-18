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
      <section className={sectionContainerClass(false) + " space-y-3"}>
        <h3 className="text-lg font-semibold">Derived Stats</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 text-sm">
          <div>Strength Bonus (SB): <strong>{SB}</strong></div>
          <div>Toughness Bonus (TB): <strong>{TB}</strong></div>
          <div>Agility Bonus (AgB): <strong>{AgB}</strong></div>
          <div>Intelligence Bonus (IB): <strong>{IB}</strong></div>
          <div>Perception Bonus (PB): <strong>{PB}</strong></div>
          <div>Willpower Bonus (WPB): <strong>{WPB}</strong></div>
          <div>Fellowship Bonus (FB): <strong>{FB}</strong></div>

          <div className="col-span-full mt-2 font-semibold text-slate-200">
            Movement
          </div>
          <div>Half Move: <strong>{AgB}</strong></div>
          <div>Full Move: <strong>{AgB * 2}</strong></div>
          <div>Charge: <strong>{AgB * 3}</strong></div>
          <div>Run: <strong>{AgB * 6}</strong></div>
        </div>
      </section>
    </div>
  );
}