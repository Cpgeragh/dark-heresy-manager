import type { CharField } from "../../utils/characterFactory";
import type { Characteristics } from "../../types/Character";
import CharacteristicField from "../../components/CharacteristicField";

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
  // Helper: total of a char field (authoritative roll value)
  function total(stat: keyof Characteristics) {
    const v = getCharField(stat);
    return v.base + v.advances;
  }

  // Derived stat helpers (unchanged)
  const SB = Math.floor(total("s") / 10);
  const TB = Math.floor(total("t") / 10);
  const AgB = Math.floor(total("ag") / 10);
  const IB = Math.floor(total("int") / 10);
  const PB = Math.floor(total("per") / 10);
  const WPB = Math.floor(total("wp") / 10);
  const FB = Math.floor(total("fel") / 10);

  function StatBlock({
    label,
    statKey,
  }: {
    label: string;
    statKey: keyof Characteristics;
  }) {
    const value = getCharField(statKey);
    const statTotal = value.base + value.advances;

    return (
      <div className="p-3 rounded border border-slate-700 bg-slate-900/40">
        {/* Total (primary) */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="text-2xl font-semibold text-slate-100 font-mono">
            {statTotal}
          </span>
        </div>

        {/* Base / Advances (secondary) */}
        <CharacteristicField
          label=""
          value={value}
          editable={editable}
          onChange={(v) => updateCharacteristic(statKey, v)}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Characteristics</h2>

      {/* Main Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      {/* Derived Stats Block */}
      <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/40">
        <h3 className="text-lg font-semibold mb-3">Derived Stats</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 text-slate-300">
          <div>Strength Bonus (SB): <strong>{SB}</strong></div>
          <div>Toughness Bonus (TB): <strong>{TB}</strong></div>
          <div>Agility Bonus (AgB): <strong>{AgB}</strong></div>
          <div>Intelligence Bonus (IB): <strong>{IB}</strong></div>
          <div>Perception Bonus (PB): <strong>{PB}</strong></div>
          <div>Willpower Bonus (WPB): <strong>{WPB}</strong></div>
          <div>Fellowship Bonus (FB): <strong>{FB}</strong></div>

          {/* Movement block */}
          <div className="col-span-full mt-3 font-semibold text-slate-200">
            Movement
          </div>
          <div>Half Move: <strong>{AgB}</strong></div>
          <div>Full Move: <strong>{AgB * 2}</strong></div>
          <div>Charge: <strong>{AgB * 3}</strong></div>
          <div>Run: <strong>{AgB * 6}</strong></div>
        </div>
      </div>
    </div>
  );
}