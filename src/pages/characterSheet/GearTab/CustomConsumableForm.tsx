// src/pages/characterSheet/GearTab/CustomConsumableForm.tsx

import { useState } from "react";
import type { ConsumableItem } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
  uiFormLabel,
} from "../../../ui/editableStyles";
import { uiPickerBackButton } from "../../../ui/buttonStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { PickerModal } from "../../../ui/PickerModal";
import { sourceColour } from "../../../ui/sourceStyles";
import { CUSTOM_AVAILABILITY_OPTIONS, sanitizePositiveIntegerInput } from "../weapons/weaponShared";

interface Props {
  initialItem?: Partial<ConsumableItem>;
  title?: string;
  submitLabel?: string;
  includeQuantity?: boolean;
  onAdd: (item: ConsumableItem) => void | Promise<void>;
  onCancel: () => void;
}

const CUSTOM_CONSUMABLE_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

export function CustomConsumableForm({
  initialItem,
  title = "Custom Consumable",
  submitLabel = "Add",
  includeQuantity = true,
  onAdd,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [quantity, setQuantity] = useState(
    initialItem?.quantity ? String(initialItem.quantity) : ""
  );
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_CONSUMABLE_ORIGIN_OPTIONS)[number]>(
    initialItem?.source === "Custom" || initialItem?.source === "2nd Ed" ? initialItem.source : ""
  );
  const [availability, setAvailability] = useState(initialItem?.availability ?? "");
  const [weight, setWeight] = useState(initialItem?.weight ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [saving, setSaving] = useState(false);
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

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => {}}
      onClose={onCancel}
      isEmpty={false}
      hideSearch
      maxHeight="max-h-[92vh]"
      footer={
        <div className="space-y-2">
          {!canAdd && (
            <p className="text-xs lg:text-sm text-slate-300">
              <span className="text-red-500">*</span> Required
            </p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={addConsumable} disabled={!canAdd || saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
            <button
              onClick={onCancel}
              className={uiPickerBackButton}
            >
              Cancel
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 lg:p-5 space-y-4">
        <p className={uiSectionHeader}>Identity</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Consumable name..."
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            {includeQuantity && (
              <div>
                <label className={uiFormLabel}>
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
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
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_CONSUMABLE_ORIGIN_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setOrigin(option)}
                className={[
                  "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                  origin === option
                    ? `${sourceColour(option)} bg-slate-800/70 font-semibold`
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <p className={uiSectionHeader}>Details</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={uiFormLabel}>
                Weight <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div>
              <label className={uiFormLabel}>
                Cost <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Availability <span className="text-red-500">*</span>
              </label>
              <select
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose availability</option>
                {CUSTOM_AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Rules</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Rules
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Notes, dose, effects..."
                rows={3}
                className={editableTextareaClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}
