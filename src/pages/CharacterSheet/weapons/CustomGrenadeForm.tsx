// src/pages/CharacterSheet/weapons/CustomGrenadeForm.tsx

import { useRef, useState } from "react";
import type { GrenadeItem } from "../../../types/Character";
import {
  editableInputClass,
  uiTwoColumnGrid,
  uiInputRowGrid,
  uiOptionGrid,
} from "../../../ui/styles/editableStyles";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { colourToggleSelected } from "../../../ui/styles/colourTokens";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { DescriptionAndRulesFields } from "../../../ui/forms/DescriptionAndRulesFields";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { PickerField } from "../../../ui/pickers/PickerField";
import { FormLabel } from "../../../ui/forms/FormLabel";
import { STANDARD_AVAILABILITY_OPTIONS } from "../../../constants/availability";
import {
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
  sanitizePositiveIntegerInput,
} from "../../../utils/formInput";
import { WeaponQualitySelector } from "./weaponShared";
import { DAMAGE_TYPE_OPTIONS, formatDamageInput, isValidDiceInput } from "./weaponDamageFormatting";
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
  onAdd: (item: GrenadeItem) => void | Promise<void>;
  onCancel: () => void;
}) {
  const formScrollPositionRef = useRef(0);
  const [saving, setSaving] = useState(false);
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
  const [rules, setRules] = useState(initialGrenade?.rules ?? "");
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

  const addGrenade = async () => {
    if (!canAdd || !type || !origin) return;
    setSaving(true);
    try {
      await onAdd({
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
        rules: rules.trim() || undefined,
        equipped: initialGrenade?.equipped,
        customLibraryId: initialGrenade?.customLibraryId,
        customLibraryVersionId: initialGrenade?.customLibraryVersionId,
      });
    } finally {
      setSaving(false);
    }
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
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div className={uiTwoColumnGrid}>
          <div className="col-span-2">
            <FormLabel htmlFor="custom-grenade-name" required>
              Name
            </FormLabel>
            <input
              id="custom-grenade-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
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
            <FormLabel htmlFor="custom-grenade-quantity" required>
              Quantity
            </FormLabel>
            <input
              id="custom-grenade-quantity"
              required
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(sanitizePositiveIntegerInput(event.target.value))}
              placeholder="1+"
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
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
        <div className={`${uiOptionGrid} grid-cols-3`} role="group" aria-label="Damage mode">
          {(["damage", "special", "none"] as const).map((option) => (
            <ToggleButton
              key={option}
              selected={damageMode === option}
              selectedClassName={colourToggleSelected.slate}
              className="px-2 py-1 text-xs lg:text-sm capitalize"
              onClick={() => setDamageMode(option)}
            >
              {option === "none" ? "No damage" : option}
            </ToggleButton>
          ))}
        </div>
        {damageMode === "damage" && (
          <fieldset aria-required="true">
            <FormLabel as="legend" required>
              Damage
            </FormLabel>
            <div className={`${uiInputRowGrid} mt-0.5`}>
              <input
                aria-label="Damage dice"
                required
                value={damageBase}
                onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                className={editableInputClass(true)}
                autoComplete="off"
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
                autoComplete="off"
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
          <FormLabel htmlFor="custom-grenade-pen" required>
            Pen
          </FormLabel>
          <input
            id="custom-grenade-pen"
            required
            type="text"
            inputMode="numeric"
            value={pen}
            onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
            className={editableInputClass(true) + " mt-0.5"}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className={uiTwoColumnGrid}>
          <div>
            <FormLabel htmlFor="custom-grenade-weight" required>
              Weight
            </FormLabel>
            <input
              id="custom-grenade-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
            />
          </div>
          <div>
            <FormLabel htmlFor="custom-grenade-cost" required>
              Cost
            </FormLabel>
            <input
              id="custom-grenade-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
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

      <CustomFormSection title="Description, Rules, & Qualities">
        <div className={uiTwoColumnGrid}>
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
          <DescriptionAndRulesFields
            idPrefix="custom-grenade"
            description={description}
            onDescriptionChange={setDescription}
            rules={rules}
            onRulesChange={setRules}
          />
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
