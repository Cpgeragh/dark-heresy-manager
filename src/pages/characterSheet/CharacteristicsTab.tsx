// src/pages/characterSheet/CharacteristicsTab.tsx

import { useCallback } from "react";
import type { CharField } from "../../utils/characterFactory";
import type { Characteristics } from "../../types/Character";
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
        <span className="text-sm lg:text-base text-slate-100">{label}</span>
        <span className="text-xl lg:text-2xl font-semibold font-code text-slate-100">{statTotal}</span>
      </div>

      {/* Base / Advances */}
      <CharacteristicField label="" value={value} editable={editable} onChange={handleChange} />
    </div>
  );
}

// ─── CharacteristicsTab ───────────────────────────────────────────────────────

interface CharacteristicsTabProps {
  getCharField: (statKey: keyof Characteristics) => CharField;
  getCharTotal: (statKey: keyof Characteristics) => number;
  editable: boolean;
  updateCharacteristic: (statKey: keyof Characteristics, value: CharField) => void;
}

export function CharacteristicsTab({
  getCharField,
  getCharTotal,
  editable,
  updateCharacteristic,
}: CharacteristicsTabProps) {
  const SB = Math.floor(getCharTotal("s") / CHARACTERISTIC_BONUS_DIVISOR);
  const TB = Math.floor(getCharTotal("t") / CHARACTERISTIC_BONUS_DIVISOR);
  const AB = Math.floor(getCharTotal("ag") / CHARACTERISTIC_BONUS_DIVISOR);
  const IB = Math.floor(getCharTotal("int") / CHARACTERISTIC_BONUS_DIVISOR);
  const PB = Math.floor(getCharTotal("per") / CHARACTERISTIC_BONUS_DIVISOR);
  const WPB = Math.floor(getCharTotal("wp") / CHARACTERISTIC_BONUS_DIVISOR);
  const FB = Math.floor(getCharTotal("fel") / CHARACTERISTIC_BONUS_DIVISOR);

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
              <div className={uiCellValueSm}>{getCharTotal(key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Characteristic Bonuses */}
      <div>
        <SectionHeader className="mb-2">Characteristic Bonuses</SectionHeader>
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

      {/* Main stats — stat entry blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBlock
          label="Weapon Skill (WS)"
          statKey="ws"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Ballistic Skill (BS)"
          statKey="bs"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Strength (S)"
          statKey="s"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Toughness (T)"
          statKey="t"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Agility (Ag)"
          statKey="ag"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Intelligence (Int)"
          statKey="int"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Perception (Per)"
          statKey="per"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Willpower (WP)"
          statKey="wp"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
        <StatBlock
          label="Fellowship (Fel)"
          statKey="fel"
          editable={editable}
          getCharField={getCharField}
          updateCharacteristic={updateCharacteristic}
        />
      </div>
    </div>
  );
}
