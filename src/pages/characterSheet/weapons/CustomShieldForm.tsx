// src/pages/characterSheet/weapons/CustomShieldForm.tsx

import { useState } from "react";
import type { ShieldItem } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
  uiFormLabel,
} from "../../../ui/editableStyles";
import { uiPickerBackButton } from "../../../ui/buttonStyles";
import { Button } from "../../../ui/Button";
import { PickerBody, PickerModal } from "../../../ui/PickerModal";
import { OptionPickerScreen } from "../../../ui/OptionPickerScreen";
import { ArrowRight } from "../../../ui/PickerArrows";
import { sourceColour } from "../../../ui/sourceStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import {
  WeaponQualitySelector,
  useWeaponQualityPicker,
  DAMAGE_TYPE_OPTIONS,
  CUSTOM_AVAILABILITY_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
} from "./weaponShared";

const CUSTOM_SHIELD_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

function isCustomShieldOrigin(
  value: string | undefined
): value is (typeof CUSTOM_SHIELD_ORIGIN_OPTIONS)[number] {
  return CUSTOM_SHIELD_ORIGIN_OPTIONS.includes(value as (typeof CUSTOM_SHIELD_ORIGIN_OPTIONS)[number]);
}

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
  const initialDamage = parseInitialShieldDamage(initialShield?.damage);
  const [name, setName] = useState(initialShield?.name ?? "");
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_SHIELD_ORIGIN_OPTIONS)[number]>(
    isCustomShieldOrigin(initialShield?.source) ? initialShield.source : ""
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
      ? initialShield.specialRules.split(",").map((rule) => rule.trim()).filter(Boolean)
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
            <Button className="flex-1" onClick={addShield} disabled={!canAdd}>
              {submitLabel}
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
      <PickerBody>
        <p className={uiSectionHeader}>Identity</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Name <span className="text-red-500">*</span>
              </label>
              <input value={name} onChange={(event) => setName(event.target.value)} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Locations <span className="text-red-500">*</span>
              </label>
              <input value={locations} onChange={(event) => setLocations(event.target.value)} placeholder="Arm & Body" className={editableInputClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_SHIELD_ORIGIN_OPTIONS.map((option) => (
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

        <p className={uiSectionHeader}>Combat</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={uiFormLabel}>
                AP <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={ap} onChange={(event) => setAp(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div>
              <label className={uiFormLabel}>
                Pen <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={pen} onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Bash Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input value={damageBase} onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))} className={editableInputClass(true)} />
                <input type="text" inputMode="numeric" value={damagePlus} onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true)} />
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
          </div>
        </div>

        <p className={uiSectionHeader}>Details</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={uiFormLabel}>
                Weight <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="decimal" value={weight} onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div>
              <label className={uiFormLabel}>
                Cost <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={value} onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
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
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={editableTextareaClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
