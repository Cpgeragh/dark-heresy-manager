// src/pages/CharacterSheet/weapons/CustomRangedForm.tsx

import { useRef, useState } from "react";
import type { RangedWeapon, WeaponCraftsmanship } from "../../../types/Character";
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
  parseWeaponDamage,
  splitWeaponQualities,
} from "./weaponDamageFormatting";
import { useWeaponQualityPicker } from "./useWeaponQualityPicker";
import { CUSTOM_AMMO_FAMILY_OPTIONS, type AmmoTrackingMode } from "./weaponHelpers";

const CUSTOM_RANGED_CLASS_OPTIONS = ["Pistol", "Basic", "Heavy", "Thrown", "Exotic"] as const;
const RELOAD_TYPE_OPTIONS = ["Half", "Full", "Round", "Special", "—"] as const;

function stripMeters(value?: string): string {
  return value?.replace(/\s*m$/i, "").trim() ?? "";
}

function parseRofInput(value?: string) {
  const [single = "S", semi = "", full = ""] = (value ?? "S/-/-").split("/");
  return {
    singleShot: single.trim().toUpperCase() === "S",
    semiAuto: semi.trim().replace(/[^\d]/g, ""),
    fullAuto: full.trim().replace(/[^\d]/g, ""),
  };
}

function parseReloadInput(value?: string) {
  if (!value) return { amount: "", type: "" };
  if (value === "Special" || value === "-") {
    return { amount: "", type: value === "-" ? "—" : value };
  }

  const match = value.match(/^(\d+)\s+(.+)$/);
  return {
    amount: match?.[1] ?? "",
    type: match?.[2] ?? value,
  };
}

export function CustomRangedForm({
  onAdd,
  onCancel,
  title = "Custom Ranged Weapon",
  submitLabel = "Add",
  integrated = false,
  initialWeapon,
}: {
  onAdd: (w: RangedWeapon) => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  submitLabel?: string;
  integrated?: boolean;
  initialWeapon?: Partial<RangedWeapon>;
}) {
  const formScrollPositionRef = useRef(0);
  const parsedDamage = parseWeaponDamage(initialWeapon?.damage, "I");
  const parsedReload = parseReloadInput(initialWeapon?.rld);
  const parsedRof = parseRofInput(initialWeapon?.rof);
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
  const [rangeMeters, setRangeMeters] = useState(stripMeters(initialWeapon?.range));
  const [ammoType, setAmmoType] = useState(initialWeapon?.ammoType ?? "");
  const [singleShot, setSingleShot] = useState(parsedRof.singleShot);
  const [semiAuto, setSemiAuto] = useState(parsedRof.semiAuto);
  const [fullAuto, setFullAuto] = useState(parsedRof.fullAuto);
  const [damageBase, setDamageBase] = useState(parsedDamage.base);
  const [damagePlus, setDamagePlus] = useState(parsedDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    parsedDamage.type
  );
  const [pen, setPen] = useState(initialWeapon?.pen ?? "");
  const [clip, setClip] = useState(initialWeapon?.clip ?? "");
  const [reloadAmount, setReloadAmount] = useState(parsedReload.amount);
  const [reloadType, setReloadType] = useState(parsedReload.type);
  const [ammoTracking, setAmmoTracking] = useState<"" | AmmoTrackingMode>(
    initialWeapon?.ammoTracking ?? ""
  );
  const [weight, setWeight] = useState(initialWeapon?.weight ?? "");
  const [value, setValue] = useState(initialWeapon?.value ?? "");
  const [availability, setAvailability] = useState(initialWeapon?.availability ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    splitWeaponQualities(initialWeapon?.specialRules)
  );
  const [description, setDescription] = useState(initialWeapon?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showAmmoFamilyPicker, setShowAmmoFamilyPicker] = useState(false);
  const [showDamageTypePicker, setShowDamageTypePicker] = useState(false);
  const [showReloadTypePicker, setShowReloadTypePicker] = useState(false);
  const [showAmmoTrackingPicker, setShowAmmoTrackingPicker] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const qualityPicker = useWeaponQualityPicker(selectedQualities, setSelectedQualities);

  const rof = `${singleShot ? "S" : "–"}/${semiAuto || "–"}/${fullAuto || "–"}`;
  const rld =
    reloadType === "Special" || reloadType === "—"
      ? reloadType
      : reloadAmount
        ? `${reloadAmount} ${reloadType}`
        : reloadType;
  const canAdd =
    Boolean(name.trim()) &&
    Boolean(weaponClass) &&
    Boolean(craftsmanship) &&
    Boolean(origin) &&
    Boolean(rangeMeters) &&
    Boolean(ammoType) &&
    (singleShot || Boolean(semiAuto) || Boolean(fullAuto)) &&
    isValidDiceInput(damageBase) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(clip) &&
    Boolean(reloadType) &&
    Boolean(ammoTracking) &&
    Boolean(weight.trim()) &&
    Boolean(value) &&
    Boolean(availability);

  const addWeapon = async () => {
    if (!canAdd || !ammoTracking || !craftsmanship || !origin) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialWeapon?.id ?? crypto.randomUUID(),
        custom: true,
        name: name.trim(),
        class: weaponClass,
        craftsmanship,
        source: origin,
        range: `${rangeMeters}m`,
        ammoType,
        rof,
        damage: formatDamageInput(damageBase, damagePlus, damageType),
        pen,
        clip,
        rld,
        ammoTracking,
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
        options={CUSTOM_RANGED_CLASS_OPTIONS}
        selected={weaponClass}
        onSelect={(value) => {
          setWeaponClass(value);
          setShowClassPicker(false);
        }}
        onClose={() => setShowClassPicker(false)}
      />
    );
  }
  if (showAmmoFamilyPicker) {
    return (
      <OptionPickerScreen
        title="Ammo Family"
        options={CUSTOM_AMMO_FAMILY_OPTIONS.map((option) => ({
          value: option.ammoType,
          label: option.label,
        }))}
        selected={ammoType}
        onSelect={(value) => {
          setAmmoType(value);
          setShowAmmoFamilyPicker(false);
        }}
        onClose={() => setShowAmmoFamilyPicker(false)}
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
  if (showReloadTypePicker) {
    return (
      <OptionPickerScreen
        title="Reload"
        options={RELOAD_TYPE_OPTIONS}
        selected={reloadType}
        onSelect={(value) => {
          setReloadType(value);
          if (value === "Special" || value === "—") {
            setReloadAmount("");
          }
          setShowReloadTypePicker(false);
        }}
        onClose={() => setShowReloadTypePicker(false)}
      />
    );
  }
  if (showAmmoTrackingPicker) {
    return (
      <OptionPickerScreen
        title="Ammo Tracking"
        options={[
          { value: "clip", label: "Clips + rounds" },
          { value: "loose", label: "Rounds only" },
        ]}
        selected={ammoTracking}
        onSelect={(value) => {
          setAmmoTracking(value as AmmoTrackingMode);
          setShowAmmoTrackingPicker(false);
        }}
        onClose={() => setShowAmmoTrackingPicker(false)}
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
            <RequiredFormLabel htmlFor="custom-ranged-name">Name</RequiredFormLabel>
            <input
              id="custom-ranged-name"
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-ranged-class"
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
        <OriginSelector name="custom-ranged-origin" value={origin} onChange={setOrigin} />
      </CustomFormSection>

      <CustomFormSection title="Combat">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-ranged-range">Range (m)</RequiredFormLabel>
            <input
              id="custom-ranged-range"
              required
              type="text"
              inputMode="numeric"
              value={rangeMeters}
              onChange={(event) => setRangeMeters(sanitizePositiveIntegerInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <PickerField
            id="custom-ranged-ammo-family"
            label="Ammo Family"
            value={CUSTOM_AMMO_FAMILY_OPTIONS.find((o) => o.ammoType === ammoType)?.label}
            placeholder="Choose ammo family"
            required
            onClick={() => setShowAmmoFamilyPicker(true)}
          />

          <fieldset aria-required="true" className="col-span-2">
            <RequiredFormLabel as="legend">Rate of Fire</RequiredFormLabel>
            <div className="grid grid-cols-3 gap-2 mt-0.5">
              <button
                type="button"
                onClick={() => setSingleShot((value) => !value)}
                aria-pressed={singleShot}
                className={[
                  "rounded border px-2 py-1 text-sm lg:text-base font-medium transition",
                  singleShot
                    ? "border-slate-400 bg-slate-700/70 text-slate-100"
                    : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                Single
              </button>
              <input
                aria-label="Semi-auto rate"
                type="text"
                inputMode="numeric"
                value={semiAuto}
                onChange={(event) => setSemiAuto(sanitizePositiveIntegerInput(event.target.value))}
                placeholder="Semi"
                className={editableInputClass(true)}
              />
              <input
                aria-label="Full-auto rate"
                type="text"
                inputMode="numeric"
                value={fullAuto}
                onChange={(event) => setFullAuto(sanitizePositiveIntegerInput(event.target.value))}
                placeholder="Full"
                className={editableInputClass(true)}
              />
            </div>
          </fieldset>

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
                id="custom-ranged-damage-type"
                ariaLabel="Damage type"
                value={DAMAGE_TYPE_OPTIONS.find((o) => o.value === damageType)?.label ?? damageType}
                placeholder="Choose damage type"
                required
                onClick={() => setShowDamageTypePicker(true)}
              />
            </div>
          </fieldset>

          <div>
            <RequiredFormLabel htmlFor="custom-ranged-pen">Pen</RequiredFormLabel>
            <input
              id="custom-ranged-pen"
              required
              type="text"
              inputMode="numeric"
              value={pen}
              onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <div>
            <RequiredFormLabel htmlFor="custom-ranged-clip">Clip</RequiredFormLabel>
            <input
              id="custom-ranged-clip"
              required
              type="text"
              inputMode="numeric"
              value={clip}
              onChange={(event) => setClip(sanitizeNonNegativeIntegerInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <fieldset aria-required="true" className="col-span-2">
            <RequiredFormLabel as="legend">Reload</RequiredFormLabel>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <input
                aria-label="Reload amount"
                type="text"
                inputMode="numeric"
                value={reloadAmount}
                onChange={(event) =>
                  setReloadAmount(sanitizePositiveIntegerInput(event.target.value))
                }
                placeholder="Amount"
                disabled={reloadType === "Special" || reloadType === "—"}
                className={editableInputClass(reloadType !== "Special" && reloadType !== "—")}
              />
              <PickerField
                id="custom-ranged-reload-type"
                ariaLabel="Reload type"
                value={reloadType}
                placeholder="Choose reload"
                required
                onClick={() => setShowReloadTypePicker(true)}
              />
            </div>
          </fieldset>

          <PickerField
            id="custom-ranged-ammo-tracking"
            label="Ammo Tracking"
            value={
              ammoTracking === "clip"
                ? "Clips + rounds"
                : ammoTracking === "loose"
                  ? "Rounds only"
                  : ""
            }
            placeholder="Choose tracking"
            required
            onClick={() => setShowAmmoTrackingPicker(true)}
            className="col-span-2"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-ranged-weight">Weight</RequiredFormLabel>
            <input
              id="custom-ranged-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <div>
            <RequiredFormLabel htmlFor="custom-ranged-cost">Cost</RequiredFormLabel>
            <input
              id="custom-ranged-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-ranged-availability"
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
            <label htmlFor="custom-ranged-rules" className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id="custom-ranged-rules"
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
