// src/pages/characterSheet/GearTab/CustomConsumableForm.tsx

import { useRef, useState } from "react";
import type { ConsumableItem } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
} from "../../../ui/editableStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { OptionPickerScreen } from "../../../ui/OptionPickerScreen";
import { CustomFormSection } from "../../../ui/CustomFormSection";
import { CustomFormShell } from "../../../ui/CustomFormShell";
import { OriginSelector, type CustomItemOrigin } from "../../../ui/OriginSelector";
import { PickerField } from "../../../ui/PickerField";
import { RequiredFormLabel } from "../../../ui/RequiredFormLabel";
import { CUSTOM_AVAILABILITY_OPTIONS, sanitizePositiveIntegerInput } from "../weapons/weaponShared";

interface Props {
  initialItem?: Partial<ConsumableItem>;
  title?: string;
  submitLabel?: string;
  includeQuantity?: boolean;
  onAdd: (item: ConsumableItem) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomConsumableForm({
  initialItem,
  title = "Custom Consumable",
  submitLabel = "Add",
  includeQuantity = true,
  onAdd,
  onCancel,
}: Props) {
  const formScrollPositionRef = useRef(0);
  const [name, setName] = useState(initialItem?.name ?? "");
  const [quantity, setQuantity] = useState(
    initialItem?.quantity ? String(initialItem.quantity) : ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialItem?.source === "Custom" || initialItem?.source === "2nd Ed" ? initialItem.source : ""
  );
  const [availability, setAvailability] = useState(initialItem?.availability ?? "");
  const [weight, setWeight] = useState(initialItem?.weight ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const quantityNumber = Number(quantity);
  const quantityValid = !includeQuantity || (Number.isInteger(quantityNumber) && quantityNumber >= 1);

  const canAdd =
    Boolean(name.trim()) &&
    quantityValid &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addConsumable = async () => {
    if (!canAdd || !origin) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialItem?.id ?? crypto.randomUUID(),
        name: name.trim(),
        quantity: includeQuantity ? quantityNumber : initialItem?.quantity ?? 1,
        weight: formatWeightInput(weight),
        value: formatMoneyInput(value),
        availability,
        source: origin,
        description: description.trim() || undefined,
        customLibraryId: initialItem?.customLibraryId,
        customLibraryVersionId: initialItem?.customLibraryVersionId,
      });
    } finally {
      setSaving(false);
    }
  };

  if (showAvailabilityPicker) {
    return (
      <OptionPickerScreen
        title="Availability"
        options={CUSTOM_AVAILABILITY_OPTIONS}
        selected={availability}
        onSelect={(value) => {
          setAvailability(value);
          setShowAvailabilityPicker(false);
        }}
        onClose={() => setShowAvailabilityPicker(false)}
      />
    );
  }

  return (
    <CustomFormShell
      title={title}
      scrollPositionRef={formScrollPositionRef}
      onClose={onCancel}
      canSubmit={canAdd}
      submitLabel={submitLabel}
      onSubmit={addConsumable}
      saving={saving}
    >
      <CustomFormSection title="Identity">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <RequiredFormLabel htmlFor="custom-consumable-name">Name</RequiredFormLabel>
              <input
                id="custom-consumable-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Consumable name..."
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            {includeQuantity && (
              <div>
                <RequiredFormLabel htmlFor="custom-consumable-quantity">Quantity</RequiredFormLabel>
                <input
                  id="custom-consumable-quantity"
                  required
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(sanitizePositiveIntegerInput(event.target.value))}
                  placeholder="1+"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
            )}
          </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector
          name="custom-consumable-origin"
          value={origin}
          onChange={setOrigin}
          hideLabel
        />
      </CustomFormSection>

      <CustomFormSection title="Details">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <RequiredFormLabel htmlFor="custom-consumable-weight">Weight</RequiredFormLabel>
              <input
                id="custom-consumable-weight"
                required
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div>
              <RequiredFormLabel htmlFor="custom-consumable-cost">Cost</RequiredFormLabel>
              <input
                id="custom-consumable-cost"
                required
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <PickerField
              id="custom-consumable-availability"
              label="Availability"
              value={availability}
              placeholder="Choose availability"
              required
              onClick={() => setShowAvailabilityPicker(true)}
              className="col-span-2"
            />
          </div>
      </CustomFormSection>

      <CustomFormSection title="Rules">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label htmlFor="custom-consumable-rules" className={uiFormLabel}>Rules</label>
              <textarea
                id="custom-consumable-rules"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Notes, dose, effects..."
                rows={3}
                className={editableTextareaClass(true) + " mt-0.5"}
              />
            </div>
          </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
