// src/pages/characterSheet/GearTab/CustomItemForm.tsx

import { useRef, useState } from "react";
import type { GearItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass, uiFormLabel } from "../../../ui/editableStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { OptionPickerScreen } from "../../../ui/OptionPickerScreen";
import { CustomFormSection } from "../../../ui/CustomFormSection";
import { CustomFormShell } from "../../../ui/CustomFormShell";
import { OriginSelector } from "../../../ui/OriginSelector";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { PickerField } from "../../../ui/PickerField";
import { RequiredFormLabel } from "../../../ui/RequiredFormLabel";
import { STANDARD_AVAILABILITY_OPTIONS } from "../../../constants/availability";

interface Props {
  initialItem?: Partial<GearItem>;
  title?: string;
  submitLabel?: string;
  onAdd: (item: GearItem) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomItemForm({
  initialItem,
  title = "Custom Item",
  submitLabel = "Add",
  onAdd,
  onCancel,
}: Props) {
  const formScrollPositionRef = useRef(0);
  const [name, setName] = useState(initialItem?.name ?? "");
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialItem?.source === "Custom" || initialItem?.source === "2nd Ed" ? initialItem.source : ""
  );
  const [availability, setAvailability] = useState(initialItem?.availability ?? "");
  const [weight, setWeight] = useState(initialItem?.weight ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);

  const canAdd =
    Boolean(name.trim()) &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addItem = async () => {
    if (!canAdd || !origin) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialItem?.id ?? crypto.randomUUID(),
        name: name.trim(),
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
        options={STANDARD_AVAILABILITY_OPTIONS}
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
      onSubmit={addItem}
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-gear-name">Name</RequiredFormLabel>
            <input
              id="custom-gear-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Item name..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector name="custom-gear-origin" value={origin} onChange={setOrigin} hideLabel />
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-gear-weight">Weight</RequiredFormLabel>
            <input
              id="custom-gear-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-gear-cost">Cost</RequiredFormLabel>
            <input
              id="custom-gear-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-gear-availability"
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
            <label htmlFor="custom-gear-rules" className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id="custom-gear-rules"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Notes, properties, weight, craftsmanship..."
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
