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
import { PickerModal } from "../../../ui/PickerModal";
import { sourceColour } from "../../../ui/sourceStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import {
  WeaponQualitySelector,
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
      <div className="p-4 lg:p-5 space-y-4">
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
                <select value={damageType} onChange={(event) => setDamageType(event.target.value as typeof damageType)} className={editableInputClass(true)}>
                  {DAMAGE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
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
              <select value={availability} onChange={(event) => setAvailability(event.target.value)} className={editableInputClass(true) + " mt-0.5"}>
                <option value="">Choose availability</option>
                {CUSTOM_AVAILABILITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Rules</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <WeaponQualitySelector selected={selectedQualities} onChange={setSelectedQualities} />
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Rules
              </label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={editableTextareaClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}
