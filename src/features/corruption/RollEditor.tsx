import { useState } from "react";
import { Button } from "../../ui/Button";
import { PickerModal } from "../../ui/PickerModal";
import { ArrowLeft } from "../../ui/PickerArrows";
import { editableInputClass, uiFormLabel } from "../../ui/editableStyles";
import { CHARACTERISTIC_LABELS, type CharacteristicModifier } from "./characteristicModifiers";

export function RollEditor({
  title,
  modifiers,
  initialRolledModifiers,
  onSave,
  onCancel,
}: {
  title: string;
  modifiers: CharacteristicModifier[];
  initialRolledModifiers: Record<string, number> | undefined;
  onSave: (rolledModifiers: Record<string, number>) => void;
  onCancel: () => void;
}) {
  const rollModifiers = modifiers.filter((modifier) => modifier.kind === "roll1d10");
  const [rolls, setRolls] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rollModifiers.map((modifier) => [
        modifier.characteristic,
        initialRolledModifiers?.[modifier.characteristic]?.toString() ?? "",
      ])
    )
  );

  const canSave = rollModifiers.every((modifier) => {
    const parsed = Number(rolls[modifier.characteristic]);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10;
  });

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => undefined}
      onClose={onCancel}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      hideSearch
      isEmpty={false}
      footer={
        <Button
          className="w-full"
          disabled={!canSave}
          onClick={() =>
            onSave(
              Object.fromEntries(
                rollModifiers.map((modifier) => [modifier.characteristic, Number(rolls[modifier.characteristic])])
              )
            )
          }
        >
          Save Rolls
        </Button>
      }
    >
      <div className="space-y-4 p-4 lg:p-5">
        {rollModifiers.map((modifier) => (
          <div key={modifier.characteristic}>
            <label className={uiFormLabel}>
              {CHARACTERISTIC_LABELS[modifier.characteristic]} roll (1d10) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={rolls[modifier.characteristic] ?? ""}
              onChange={(event) => setRolls((prev) => ({ ...prev, [modifier.characteristic]: event.target.value }))}
              placeholder="Enter rolled value..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        ))}
      </div>
    </PickerModal>
  );
}
