import { editableInputClass } from "../../ui/styles/editableStyles";
import { CHARACTERISTIC_LABELS, type CharacteristicModifier } from "./characteristicModifiers";
import type { RollValues } from "./rollModifierValues";
import { FormLabel } from "../../ui/forms/FormLabel";

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
        <FormLabel htmlFor={inputId} required>
          {CHARACTERISTIC_LABELS[modifier.characteristic]} Roll (1d10)
        </FormLabel>
        <input
          id={inputId}
          type="number"
          min={1}
          max={10}
          value={rolls[modifier.characteristic] ?? ""}
          onChange={(event) => onRollChange(modifier.characteristic, event.target.value)}
          placeholder="Enter rolled value..."
          className={editableInputClass(true) + " mt-0.5"}
          autoComplete="off"
        />
      </div>
    );
  });
}
