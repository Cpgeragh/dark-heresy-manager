// src/pages/CharacterSheet/weapons/CustomMeleeForm.tsx

import { useRef, useState } from "react";
import type { MeleeWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
} from "../../../ui/styles/editableStyles";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { PickerField } from "../../../ui/pickers/PickerField";
import { RequiredFormLabel } from "../../../ui/forms/RequiredFormLabel";
import { STANDARD_AVAILABILITY_OPTIONS } from "../../../constants/availability";
import { sanitizeDiceInput, sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";
import { WeaponQualitySelector } from "./weaponShared";
import {
  DAMAGE_TYPE_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
  parseWeaponDamage,
  splitWeaponQualities,
} from "./weaponDamageFormatting";
import { useWeaponQualityPicker } from "./useWeaponQualityPicker";

const CUSTOM_MELEE_CLASS_OPTIONS = ["Melee", "Melee (Two-Handed)", "Melee / Thrown"] as const;

export function CustomMeleeForm({
  onAdd,
  onCancel,
  title = "Custom Melee Weapon",
  submitLabel = "Add",
  integrated = false,
  initialWeapon,
}: {
  onAdd: (w: MeleeWeapon) => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  submitLabel?: string;
  integrated?: boolean;
  initialWeapon?: Partial<MeleeWeapon>;
}) {
  const formScrollPositionRef = useRef(0);
  const parsedDamage = parseWeaponDamage(initialWeapon?.damage, "R");
  const [name, setName] = useState(initialWeapon?.name ?? "");
  const [weaponClass, setWeaponClass] = useState(initialWeapon?.class ?? "");
  const [craftsmanship, setCraftsmanship] = useState<"" | WeaponCraftsmanship>(
    initialWeapon?.craftsmanship ?? ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialWeapon?.source === "Custom" || initialWeapon?.source === "2nd Ed"
      ? initialWeapon.source
      : ""
  );
  const [damageBase, setDamageBase] = useState(parsedDamage.base);
  const [damagePlus, setDamagePlus] = useState(parsedDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    parsedDamage.type
  );
  const [pen, setPen] = useState(initialWeapon?.pen ?? "");
  const [weight, setWeight] = useState(initialWeapon?.weight ?? "");
  const [value, setValue] = useState(initialWeapon?.value ?? "");
  const [availability, setAvailability] = useState(initialWeapon?.availability ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    splitWeaponQualities(initialWeapon?.specialRules)
  );
  const [description, setDescription] = useState(initialWeapon?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showDamageTypePicker, setShowDamageTypePicker] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const qualityPicker = useWeaponQualityPicker(selectedQualities, setSelectedQualities);

  const canAdd =
    Boolean(name.trim()) &&
    Boolean(weaponClass) &&
    Boolean(craftsmanship) &&
    Boolean(origin) &&
    isValidDiceInput(damageBase) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(weight.trim()) &&
    Boolean(value) &&
    Boolean(availability);

  const addWeapon = async () => {
    if (!canAdd || !craftsmanship || !origin) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialWeapon?.id ?? crypto.randomUUID(),
        custom: true,
        name: name.trim(),
        class: weaponClass,
        craftsmanship,
        source: origin,
        damage: formatDamageInput(damageBase, damagePlus, damageType),
        pen,
        weight: formatWeightInput(weight),
        value: formatMoneyInput(value),
        availability,
        specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
        description: description.trim() || undefined,
        integrated: initialWeapon?.integrated ?? integrated,
        quantity:
          initialWeapon?.quantity ?? (weaponClass.toLowerCase().includes("thrown") ? 1 : undefined),
        customLibraryId: initialWeapon?.customLibraryId,
        customLibraryVersionId: initialWeapon?.customLibraryVersionId,
        equipped: initialWeapon?.equipped,
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
  if (showClassPicker) {
    return (
      <OptionPickerScreen
        title="Class"
        options={CUSTOM_MELEE_CLASS_OPTIONS}
        selected={weaponClass}
        onSelect={(value) => {
          setWeaponClass(value);
          setShowClassPicker(false);
        }}
        onClose={() => setShowClassPicker(false)}
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
      onSubmit={addWeapon}
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-melee-name">Name</RequiredFormLabel>
            <input
              id="custom-melee-name"
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <PickerField
            id="custom-melee-class"
            label="Class"
            value={weaponClass}
            placeholder="Choose class"
            required
            onClick={() => setShowClassPicker(true)}
            className="col-span-2"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Craftsmanship & Origin">
        <fieldset aria-required="true" className="space-y-1">
          <RequiredFormLabel as="legend">Craftsmanship</RequiredFormLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {CRAFTSMANSHIP_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={craftsmanship === option}
                onClick={() => setCraftsmanship(option)}
                className={[
                  "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                  craftsmanship === option
                    ? CRAFTSMANSHIP_STYLE[option]
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <OriginSelector name="custom-melee-origin" value={origin} onChange={setOrigin} />
      </CustomFormSection>

      <CustomFormSection title="Combat">
        <div className="grid grid-cols-2 gap-2">
          <fieldset aria-required="true" className="col-span-2">
            <RequiredFormLabel as="legend">Damage</RequiredFormLabel>
            <div className="grid grid-cols-3 gap-2 mt-0.5">
              <input
                aria-label="Damage dice"
                required
                type="text"
                value={damageBase}
                onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                placeholder="1d10"
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
                placeholder="Plus"
                className={editableInputClass(true)}
              />
              <PickerField
                id="custom-melee-damage-type"
                ariaLabel="Damage type"
                value={DAMAGE_TYPE_OPTIONS.find((o) => o.value === damageType)?.label ?? damageType}
                placeholder="Choose damage type"
                required
                onClick={() => setShowDamageTypePicker(true)}
              />
            </div>
          </fieldset>

          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-melee-pen">Pen</RequiredFormLabel>
            <input
              id="custom-melee-pen"
              required
              type="text"
              inputMode="numeric"
              value={pen}
              onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-melee-weight">Weight</RequiredFormLabel>
            <input
              id="custom-melee-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <div>
            <RequiredFormLabel htmlFor="custom-melee-cost">Cost</RequiredFormLabel>
            <input
              id="custom-melee-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-melee-availability"
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
            <label htmlFor="custom-melee-rules" className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id="custom-melee-rules"
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
