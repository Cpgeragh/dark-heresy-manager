// src/pages/characterSheet/weapons/CustomMeleeForm.tsx

import { useState } from "react";
import type { MeleeWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
  uiFormLabel,
} from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { PickerBody, PickerModal } from "../../../ui/PickerModal";
import { OptionPickerScreen } from "../../../ui/OptionPickerScreen";
import { ArrowRight } from "../../../ui/PickerArrows";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { sourceColour } from "../../../ui/sourceStyles";
import {
  DAMAGE_TYPE_OPTIONS,
  CUSTOM_AVAILABILITY_OPTIONS,
  WeaponQualitySelector,
  useWeaponQualityPicker,
  formatDamageInput,
  isValidDiceInput,
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
} from "./weaponShared";
import { WEAPON_CRAFTSMANSHIP_OPTIONS, WEAPON_CRAFTSMANSHIP_STYLE } from "./weaponHelpers";

const CUSTOM_MELEE_CLASS_OPTIONS = ["Melee", "Melee (Two-Handed)", "Melee / Thrown"] as const;
const CUSTOM_WEAPON_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

function splitWeaponQualities(value?: string): string[] {
  if (!value || value === "-") return [];
  return value
    .split(",")
    .map((quality) => quality.trim())
    .filter(Boolean);
}

function parseWeaponDamage(
  value: string | undefined,
  fallbackType: (typeof DAMAGE_TYPE_OPTIONS)[number]["value"]
) {
  const match = value?.trim().match(/^(\d+d\d+)(?:\+(\d+))?\s*([IREX])?$/i);
  return {
    base: match?.[1] ?? "1d10",
    plus: match?.[2] ?? "0",
    type:
      (match?.[3]?.toUpperCase() as
        | (typeof DAMAGE_TYPE_OPTIONS)[number]["value"]
        | undefined) ?? fallbackType,
  };
}

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
  const parsedDamage = parseWeaponDamage(initialWeapon?.damage, "R");
  const [name, setName] = useState(initialWeapon?.name ?? "");
  const [weaponClass, setWeaponClass] = useState(initialWeapon?.class ?? "");
  const [craftsmanship, setCraftsmanship] = useState<"" | WeaponCraftsmanship>(
    initialWeapon?.craftsmanship ?? ""
  );
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_WEAPON_ORIGIN_OPTIONS)[number]>(
    (CUSTOM_WEAPON_ORIGIN_OPTIONS as readonly string[]).includes(initialWeapon?.source ?? "")
      ? (initialWeapon?.source as (typeof CUSTOM_WEAPON_ORIGIN_OPTIONS)[number])
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
        quantity: initialWeapon?.quantity ?? (weaponClass.toLowerCase().includes("thrown") ? 1 : undefined),
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
            <p className="text-xs lg:text-sm text-slate-300"><span className="text-red-500">*</span> Required</p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={addWeapon} disabled={!canAdd || saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      }
    >
      <PickerBody>
        <p className={uiSectionHeader}>Identity</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div className="col-span-2">
              <label className={uiFormLabel}>
                Class <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowClassPicker(true)}
                className={editableInputClass(true) + " mt-0.5 text-left flex items-center justify-between"}
              >
                <span className={weaponClass ? "" : "text-slate-500"}>{weaponClass || "Choose class"}</span>
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Craftsmanship & Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Craftsmanship <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {WEAPON_CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCraftsmanship(option)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    craftsmanship === option
                      ? WEAPON_CRAFTSMANSHIP_STYLE[option]
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Origin <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CUSTOM_WEAPON_ORIGIN_OPTIONS.map((option) => (
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
        </div>

        <p className={uiSectionHeader}>Combat</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input
                  type="text"
                  value={damageBase}
                  onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                  placeholder="1d10"
                  className={editableInputClass(true)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={damagePlus}
                  onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))}
                  placeholder="Plus"
                  className={editableInputClass(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowDamageTypePicker(true)}
                  className={editableInputClass(true) + " text-left flex items-center justify-between"}
                >
                  <span>{DAMAGE_TYPE_OPTIONS.find((o) => o.value === damageType)?.label ?? damageType}</span>
                  <ArrowRight />
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className={uiFormLabel}>
                Pen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pen}
                onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
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
              <button
                type="button"
                onClick={() => setShowAvailabilityPicker(true)}
                className={editableInputClass(true) + " mt-0.5 text-left flex items-center justify-between"}
              >
                <span className={availability ? "" : "text-slate-500"}>{availability || "Choose availability"}</span>
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Rules and Qualities</p>
        <div className={uiSection + " space-y-3"}>
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
              <label className={uiFormLabel}>
                Rules
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className={editableTextareaClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
