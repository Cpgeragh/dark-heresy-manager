// src/pages/CharacterSheet/weapons/CustomShieldForm.tsx

import { useRef, useState } from "react";
import type { ShieldItem } from "../../../types/Character";
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
import { sanitizeDiceInput, sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";
import { WeaponQualitySelector } from "./weaponShared";
import {
  DAMAGE_TYPE_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
} from "./weaponDamageFormatting";
import { useWeaponQualityPicker } from "./useWeaponQualityPicker";

function parseInitialShieldDamage(damage: string | undefined): {
  base: string;
  plus: string;
  type: (typeof DAMAGE_TYPE_OPTIONS)[number]["value"];
} {
  const match = damage?.trim().match(/^(\d+d\d+)(?:\+(\d+))?\s+([IREX])$/i);
  if (!match) return { base: "1d10", plus: "0", type: "I" };

  return {
    base: match[1],
    plus: match[2] ?? "0",
    type: match[3].toUpperCase() as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"],
  };
}

export function CustomShieldForm({
  title = "Custom Shield",
  submitLabel = "Add",
  initialShield,
  onAdd,
  onCancel,
}: {
  title?: string;
  submitLabel?: string;
  initialShield?: ShieldItem;
  onAdd: (item: ShieldItem) => void;
  onCancel: () => void;
}) {
  const formScrollPositionRef = useRef(0);
  const initialDamage = parseInitialShieldDamage(initialShield?.damage);
  const [name, setName] = useState(initialShield?.name ?? "");
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialShield?.source === "Custom" || initialShield?.source === "2nd Ed"
      ? initialShield.source
      : ""
  );
  const [availability, setAvailability] = useState(initialShield?.availability ?? "");
  const [ap, setAp] = useState(initialShield?.ap !== undefined ? String(initialShield.ap) : "");
  const [locations, setLocations] = useState(initialShield?.locations ?? "");
  const [damageBase, setDamageBase] = useState(initialDamage.base);
  const [damagePlus, setDamagePlus] = useState(initialDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    initialDamage.type
  );
  const [pen, setPen] = useState(initialShield?.pen ?? "0");
  const [weight, setWeight] = useState(initialShield?.weight ?? "");
  const [value, setValue] = useState(initialShield?.value ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    initialShield?.specialRules && initialShield.specialRules !== "—"
      ? initialShield.specialRules
          .split(",")
          .map((rule) => rule.trim())
          .filter(Boolean)
      : []
  );
  const [notes, setNotes] = useState(initialShield?.notes ?? "");
  const [showDamageTypePicker, setShowDamageTypePicker] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const qualityPicker = useWeaponQualityPicker(selectedQualities, setSelectedQualities);

  const canAdd =
    Boolean(name.trim()) &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(ap) &&
    Boolean(locations.trim()) &&
    isValidDiceInput(damageBase) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addShield = () => {
    if (!canAdd || !origin) return;
    onAdd({
      id: initialShield?.id ?? crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      ap: Number(ap),
      locations: locations.trim(),
      damage: formatDamageInput(damageBase, damagePlus, damageType),
      pen,
      specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
      notes: notes.trim() || undefined,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      source: origin,
      equipped: initialShield?.equipped,
      customLibraryId: initialShield?.customLibraryId,
      customLibraryVersionId: initialShield?.customLibraryVersionId,
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
      onSubmit={addShield}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-shield-name">Name</RequiredFormLabel>
            <input
              id="custom-shield-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-shield-locations">Locations</RequiredFormLabel>
            <input
              id="custom-shield-locations"
              required
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              placeholder="Arm & Body"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector name="custom-shield-origin" value={origin} onChange={setOrigin} hideLabel />
      </CustomFormSection>

      <CustomFormSection title="Combat">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-shield-ap">AP</RequiredFormLabel>
            <input
              id="custom-shield-ap"
              required
              type="text"
              inputMode="numeric"
              value={ap}
              onChange={(event) => setAp(sanitizeNonNegativeIntegerInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-shield-pen">Pen</RequiredFormLabel>
            <input
              id="custom-shield-pen"
              required
              type="text"
              inputMode="numeric"
              value={pen}
              onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <fieldset aria-required="true" className="col-span-2">
            <RequiredFormLabel as="legend">Bash Damage</RequiredFormLabel>
            <div className="grid grid-cols-3 gap-2 mt-0.5">
              <input
                aria-label="Bash damage dice"
                required
                value={damageBase}
                onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                className={editableInputClass(true)}
              />
              <input
                aria-label="Bash damage bonus"
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
                id="custom-shield-damage-type"
                ariaLabel="Bash damage type"
                value={DAMAGE_TYPE_OPTIONS.find((o) => o.value === damageType)?.label ?? damageType}
                placeholder="Choose damage type"
                required
                onClick={() => setShowDamageTypePicker(true)}
              />
            </div>
          </fieldset>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-shield-weight">Weight</RequiredFormLabel>
            <input
              id="custom-shield-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-shield-cost">Cost</RequiredFormLabel>
            <input
              id="custom-shield-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-shield-availability"
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
            <label htmlFor="custom-shield-rules" className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id="custom-shield-rules"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
