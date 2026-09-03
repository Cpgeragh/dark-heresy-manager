import { useState } from "react";
import { Button } from "../../ui/buttons/Button";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { ArrowLeft } from "../../ui/icons/PickerArrows";
import type { CharacteristicModifier } from "./characteristicModifiers";
import { RollModifierFields } from "./RollModifierFields";
import { areRollModifierValuesValid, getRoll1d10Modifiers } from "./rollModifierValues";

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
  const rollModifiers = getRoll1d10Modifiers(modifiers);
  const [rolls, setRolls] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rollModifiers.map((modifier) => [
        modifier.characteristic,
        initialRolledModifiers?.[modifier.characteristic]?.toString() ?? "",
      ])
    )
  );

  const canSave = areRollModifierValuesValid(rollModifiers, rolls);

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
                rollModifiers.map((modifier) => [
                  modifier.characteristic,
                  Number(rolls[modifier.characteristic]),
                ])
              )
            )
          }
        >
          Save Rolls
        </Button>
      }
    >
      <PickerBody>
        <RollModifierFields
          modifiers={rollModifiers}
          rolls={rolls}
          onRollChange={(characteristic, value) =>
            setRolls((previous) => ({ ...previous, [characteristic]: value }))
          }
          idPrefix="roll-editor"
        />
      </PickerBody>
    </PickerModal>
  );
}
