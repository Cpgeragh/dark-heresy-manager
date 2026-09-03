// src/pages/CharacterSheet/weapons/CustomGrenadeForm.tsx

import { useRef, useState } from "react";
import type { GrenadeItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass, uiFormLabel } from "../../../ui/styles/editableStyles";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { PickerField } from "../../../ui/pickers/PickerField";
import { RequiredFormLabel } from "../../../ui/forms/RequiredFormLabel";
import { STANDARD_AVAILABILITY_OPTIONS } from "../../../constants/availability";
import {
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
  sanitizePositiveIntegerInput,
} from "../../../utils/formInput";
import { WeaponQualitySelector } from "./weaponShared";
import {
  DAMAGE_TYPE_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
} from "./weaponDamageFormatting";
import { useWeaponQualityPicker } from "./useWeaponQualityPicker";

const CUSTOM_GRENADE_TYPE_OPTIONS = ["Grenade", "Mine"] as const;

function isCustomGrenadeType(
  value: string | undefined
): value is (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number] {
  return CUSTOM_GRENADE_TYPE_OPTIONS.includes(
    value as (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]
  );
}

function parseInitialGrenadeDamage(damage: string | undefined): {
  mode: "damage" | "special" | "none";
  base: string;
  plus: string;
  type: (typeof DAMAGE_TYPE_OPTIONS)[number]["value"];
} {
  if (!damage || damage === "—") {
    return { mode: "none", base: "1d10", plus: "0", type: "X" };
  }
  if (damage === "Special") {
    return { mode: "special", base: "1d10", plus: "0", type: "X" };
  }

  const match = damage.trim().match(/^(\d+d\d+)(?:\+(\d+))?\s+([IREX])$/i);
  if (!match) return { mode: "damage", base: "1d10", plus: "0", type: "X" };

  return {
    mode: "damage",
    base: match[1],
    plus: match[2] ?? "0",
    type: match[3].toUpperCase() as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"],
  };
}

export function CustomGrenadeForm({
  title = "Custom Grenade or Mine",
  submitLabel = "Add",
  initialGrenade,
  onAdd,
  onCancel,
}: {
  title?: string;
  submitLabel?: string;
  initialGrenade?: GrenadeItem;
  onAdd: (item: GrenadeItem) => void;
  onCancel: () => void;
}) {
  const formScrollPositionRef = useRef(0);
  const initialDamage = parseInitialGrenadeDamage(initialGrenade?.damage);
  const [name, setName] = useState(initialGrenade?.name ?? "");
  const [type, setType] = useState<"" | (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]>(
    isCustomGrenadeType(initialGrenade?.type) ? initialGrenade.type : ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialGrenade?.source === "Custom" || initialGrenade?.source === "2nd Ed"
      ? initialGrenade.source
      : ""
  );
  const [availability, setAvailability] = useState(initialGrenade?.availability ?? "");
  const [damageMode, setDamageMode] = useState<"damage" | "special" | "none">(initialDamage.mode);
  const [damageBase, setDamageBase] = useState(initialDamage.base);
  const [damagePlus, setDamagePlus] = useState(initialDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    initialDamage.type
  );
  const [pen, setPen] = useState(initialGrenade?.pen ?? "0");
  const [quantity, setQuantity] = useState(
    initialGrenade?.quantity ? String(initialGrenade.quantity) : ""
  );
  const [weight, setWeight] = useState(initialGrenade?.weight ?? "");
  const [value, setValue] = useState(initialGrenade?.value ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    initialGrenade?.specialRules && initialGrenade.specialRules !== "—"
      ? initialGrenade.specialRules
          .split(",")
          .map((rule) => rule.trim())
          .filter(Boolean)
      : []
  );
  const [description, setDescription] = useState(initialGrenade?.description ?? "");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDamageTypePicker, setShowDamageTypePicker] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const qualityPicker = useWeaponQualityPicker(selectedQualities, setSelectedQualities);

  const damage =
    damageMode === "none"
      ? "—"
      : damageMode === "special"
        ? "Special"
        : formatDamageInput(damageBase, damagePlus, damageType);
  const canAdd =
    Boolean(name.trim()) &&
    Boolean(type) &&
    Boolean(origin) &&
    Boolean(availability) &&
    (damageMode !== "damage" || isValidDiceInput(damageBase)) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(quantity) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addGrenade = () => {
    if (!canAdd || !type || !origin) return;
    onAdd({
      id: initialGrenade?.id ?? crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      quantity: Number(quantity),
      type,
      class: type === "Mine" ? "Mine" : "Thrown",
      damage,
      pen,
      specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      source: origin,
      description: description.trim() || undefined,
      equipped: initialGrenade?.equipped,
      customLibraryId: initialGrenade?.customLibraryId,
      customLibraryVersionId: initialGrenade?.customLibraryVersionId,
    });
  };

  if (qualityPicker.showPicker) {
    return (
      <OptionPickerScreen
        title="Add Quality"
        options={qualityPicker.available}
        onSelect={qualityPicker.pickQuality}
        onClose={qualityPicker.closePicker}
      />
    );
  }
  if (showTypePicker) {
    return (
      <OptionPickerScreen
        title="Type"
        options={CUSTOM_GRENADE_TYPE_OPTIONS}
        selected={type}
        onSelect={(value) => {
          setType(value as (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]);
          setShowTypePicker(false);
        }}
        onClose={() => setShowTypePicker(false)}
      />
    );
  }
  if (showDamageTypePicker) {
    return (
      <OptionPickerScreen
        title="Damage Type"
        options={DAMAGE_TYPE_OPTIONS}
        selected={damageType}
        onSelect={(value) => {
          setDamageType(value as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"]);
          setShowDamageTypePicker(false);
        }}
        onClose={() => setShowDamageTypePicker(false)}
      />
    );
  }
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
      onSubmit={addGrenade}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-grenade-name">Name</RequiredFormLabel>
            <input
              id="custom-grenade-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-grenade-type"
            label="Type"
            value={type}
            placeholder="Choose type"
            required
            onClick={() => setShowTypePicker(true)}
          />
          <div>
            <RequiredFormLabel htmlFor="custom-grenade-quantity">Quantity</RequiredFormLabel>
            <input
              id="custom-grenade-quantity"
              required
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(sanitizePositiveIntegerInput(event.target.value))}
              placeholder="1+"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector
          name="custom-grenade-origin"
          value={origin}
          onChange={setOrigin}
          hideLabel
        />
      </CustomFormSection>

      <CustomFormSection title="Combat">
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Damage mode">
          {(["damage", "special", "none"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={damageMode === option}
              onClick={() => setDamageMode(option)}
              className={`rounded border px-2 py-1 text-xs lg:text-sm capitalize transition ${
                damageMode === option
                  ? "border-slate-400 bg-slate-700/70 text-slate-100"
                  : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              {option === "none" ? "No damage" : option}
            </button>
          ))}
        </div>
        {damageMode === "damage" && (
          <fieldset aria-required="true">
            <RequiredFormLabel as="legend">Damage</RequiredFormLabel>
            <div className="grid grid-cols-3 gap-2 mt-0.5">
              <input
                aria-label="Damage dice"
                required
                value={damageBase}
                onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                className={editableInputClass(true)}
              />
              <input
                aria-label="Damage bonus"
                required
                type="text"
                inputMode="numeric"
                value={damagePlus}
                onChange={(event) =>
                  setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))
                }
                className={editableInputClass(true)}
              />
              <PickerField
                id="custom-grenade-damage-type"
                ariaLabel="Damage type"
                value={DAMAGE_TYPE_OPTIONS.find((o) => o.value === damageType)?.label ?? damageType}
                placeholder="Choose damage type"
                required
                onClick={() => setShowDamageTypePicker(true)}
              />
            </div>
          </fieldset>
        )}
        <div>
          <RequiredFormLabel htmlFor="custom-grenade-pen">Pen</RequiredFormLabel>
          <input
            id="custom-grenade-pen"
            required
            type="text"
            inputMode="numeric"
            value={pen}
            onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-grenade-weight">Weight</RequiredFormLabel>
            <input
              id="custom-grenade-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-grenade-cost">Cost</RequiredFormLabel>
            <input
              id="custom-grenade-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-grenade-availability"
            label="Availability"
            value={availability}
            placeholder="Choose availability"
            required
            onClick={() => setShowAvailabilityPicker(true)}
            className="col-span-2"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Rules and Qualities">
        <div className="grid grid-cols-2 gap-2">
          <WeaponQualitySelector
            selected={selectedQualities}
            pendingQuality={qualityPicker.pendingQuality}
            needsParameter={qualityPicker.needsParameter}
            parameterValue={qualityPicker.parameterValue}
            canConfirm={qualityPicker.canConfirm}
            onParameterValueChange={qualityPicker.setParameterValue}
            onOpenPicker={qualityPicker.openPicker}
            onConfirmPending={qualityPicker.confirmPending}
            onRemove={(q) => setSelectedQualities(selectedQualities.filter((s) => s !== q))}
          />
          <div className="col-span-2">
            <label htmlFor="custom-grenade-rules" className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id="custom-grenade-rules"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
