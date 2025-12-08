// src/pages/characterSheet/CharacteristicsTab.tsx
import type { CharField } from "../../utils/defaultCharacter";
import type { CharacteristicsBlock } from "./types";
import CharacteristicField from "../../components/CharacteristicField";

interface CharacteristicsTabProps {
  getCharField: (statKey: keyof CharacteristicsBlock) => CharField;
  editable: boolean;
  updateCharacteristic: (
    statKey: keyof CharacteristicsBlock,
    value: CharField
  ) => void;
}

export function CharacteristicsTab({
  getCharField,
  editable,
  updateCharacteristic,
}: CharacteristicsTabProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Characteristics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CharacteristicField
          label="Weapon Skill (WS)"
          value={getCharField("ws")}
          editable={editable}
          onChange={(v) => updateCharacteristic("ws", v)}
        />
        <CharacteristicField
          label="Ballistic Skill (BS)"
          value={getCharField("bs")}
          editable={editable}
          onChange={(v) => updateCharacteristic("bs", v)}
        />
        <CharacteristicField
          label="Strength (S)"
          value={getCharField("s")}
          editable={editable}
          onChange={(v) => updateCharacteristic("s", v)}
        />
        <CharacteristicField
          label="Toughness (T)"
          value={getCharField("t")}
          editable={editable}
          onChange={(v) => updateCharacteristic("t", v)}
        />
        <CharacteristicField
          label="Agility (Ag)"
          value={getCharField("ag")}
          editable={editable}
          onChange={(v) => updateCharacteristic("ag", v)}
        />
        <CharacteristicField
          label="Intelligence (Int)"
          value={getCharField("int")}
          editable={editable}
          onChange={(v) => updateCharacteristic("int", v)}
        />
        <CharacteristicField
          label="Perception (Per)"
          value={getCharField("per")}
          editable={editable}
          onChange={(v) => updateCharacteristic("per", v)}
        />
        <CharacteristicField
          label="Willpower (WP)"
          value={getCharField("wp")}
          editable={editable}
          onChange={(v) => updateCharacteristic("wp", v)}
        />
        <CharacteristicField
          label="Fellowship (Fel)"
          value={getCharField("fel")}
          editable={editable}
          onChange={(v) => updateCharacteristic("fel", v)}
        />
      </div>
    </div>
  );
}