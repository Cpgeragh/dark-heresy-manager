// src/pages/characterSheet/GearTab/CustomConsumableForm.tsx

import { useState } from "react";
import type { ConsumableItem } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
} from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { PickerModal } from "../../../ui/PickerModal";
import { sourceColour } from "../../../ui/sourceStyles";
import { CUSTOM_AVAILABILITY_OPTIONS, sanitizePositiveIntegerInput } from "../weapons/weaponShared";

interface Props {
  onAdd: (item: ConsumableItem) => void;
  onCancel: () => void;
}

const CUSTOM_CONSUMABLE_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

export function CustomConsumableForm({ onAdd, onCancel }: Props) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_CONSUMABLE_ORIGIN_OPTIONS)[number]>("");
  const [availability, setAvailability] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const quantityNumber = Number(quantity);
  const quantityValid = Number.isInteger(quantityNumber) && quantityNumber >= 1;

  const canAdd =
    Boolean(name.trim()) &&
    quantityValid &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addConsumable = () => {
    if (!canAdd || !origin) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      quantity: quantityNumber,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      source: origin,
      description: description.trim() || undefined,
    });
  };

  return (
    <PickerModal
      title="Custom Consumable"
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
            <Button className="flex-1" onClick={addConsumable} disabled={!canAdd}>
              Add
            </Button>
            <button
              onClick={onCancel}
              className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
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
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Consumable name..."
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
