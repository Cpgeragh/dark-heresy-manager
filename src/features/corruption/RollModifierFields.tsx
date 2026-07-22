import { editableInputClass, uiFormLabel } from "../../ui/editableStyles";
import { CHARACTERISTIC_LABELS, type CharacteristicModifier } from "./characteristicModifiers";
import type { RollValues } from "./rollModifierValues";

interface RollModifierFieldsProps {
  modifiers: CharacteristicModifier[];
  rolls: RollValues;
  onRollChange: (characteristic: CharacteristicModifier["characteristic"], value: string) => void;
  idPrefix?: string;
}

export function RollModifierFields({
  modifiers,
  rolls,
  onRollChange,
  idPrefix = "roll-modifier",
}: RollModifierFieldsProps) {
  return modifiers.map((modifier) => {
    const inputId = `${idPrefix}-${modifier.characteristic}`;

    return (
      <div key={modifier.characteristic}>
        <label htmlFor={inputId} className={uiFormLabel}>
          {CHARACTERISTIC_LABELS[modifier.characteristic]} roll (1d10){" "}
          <span className="text-red-500">*</span>
        </label>
        <input
          id={inputId}
          type="number"
          min={1}
          max={10}
          value={rolls[modifier.characteristic] ?? ""}
          onChange={(event) => onRollChange(modifier.characteristic, event.target.value)}
          placeholder="Enter rolled value..."
          className={editableInputClass(true) + " mt-0.5"}
        />
      </div>
    );
  });
}
