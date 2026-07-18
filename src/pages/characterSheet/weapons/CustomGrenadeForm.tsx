// src/pages/characterSheet/weapons/CustomGrenadeForm.tsx

import { useState } from "react";
import type { GrenadeItem } from "../../../types/Character";
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
  sanitizePositiveIntegerInput,
} from "./weaponShared";

const CUSTOM_GRENADE_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;
const CUSTOM_GRENADE_TYPE_OPTIONS = ["Grenade", "Mine"] as const;

function isCustomGrenadeType(
  value: string | undefined
): value is (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number] {
  return CUSTOM_GRENADE_TYPE_OPTIONS.includes(value as (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]);
}

function isCustomGrenadeOrigin(
  value: string | undefined
): value is (typeof CUSTOM_GRENADE_ORIGIN_OPTIONS)[number] {
  return CUSTOM_GRENADE_ORIGIN_OPTIONS.includes(value as (typeof CUSTOM_GRENADE_ORIGIN_OPTIONS)[number]);
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
  const initialDamage = parseInitialGrenadeDamage(initialGrenade?.damage);
  const [name, setName] = useState(initialGrenade?.name ?? "");
  const [type, setType] = useState<"" | (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]>(
    isCustomGrenadeType(initialGrenade?.type) ? initialGrenade.type : ""
  );
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_GRENADE_ORIGIN_OPTIONS)[number]>(
    isCustomGrenadeOrigin(initialGrenade?.source) ? initialGrenade.source : ""
  );
  const [availability, setAvailability] = useState(initialGrenade?.availability ?? "");
  const [damageMode, setDamageMode] = useState<"damage" | "special" | "none">(initialDamage.mode);
  const [damageBase, setDamageBase] = useState(initialDamage.base);
  const [damagePlus, setDamagePlus] = useState(initialDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    initialDamage.type
  );
  const [pen, setPen] = useState(initialGrenade?.pen ?? "0");
  const [quantity, setQuantity] = useState(initialGrenade?.quantity ? String(initialGrenade.quantity) : "");
  const [weight, setWeight] = useState(initialGrenade?.weight ?? "");
  const [value, setValue] = useState(initialGrenade?.value ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    initialGrenade?.specialRules && initialGrenade.specialRules !== "—"
      ? initialGrenade.specialRules.split(",").map((rule) => rule.trim()).filter(Boolean)
      : []
  );
  const [description, setDescription] = useState(initialGrenade?.description ?? "");

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
            <Button className="flex-1" onClick={addGrenade} disabled={!canAdd}>
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
            <div>
              <label className={uiFormLabel}>
                Type <span className="text-red-500">*</span>
              </label>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className={editableInputClass(true) + " mt-0.5"}>
                <option value="">Choose type</option>
                {CUSTOM_GRENADE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className={uiFormLabel}>
                Quantity <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(sanitizePositiveIntegerInput(event.target.value))} placeholder="1+" className={editableInputClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_GRENADE_ORIGIN_OPTIONS.map((option) => (
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
          <div className="grid grid-cols-3 gap-1.5">
            {(["damage", "special", "none"] as const).map((option) => (
              <button
                key={option}
                type="button"
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
            <div>
              <label className={uiFormLabel}>
                Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input value={damageBase} onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))} className={editableInputClass(true)} />
                <input type="text" inputMode="numeric" value={damagePlus} onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true)} />
                <select value={damageType} onChange={(event) => setDamageType(event.target.value as typeof damageType)} className={editableInputClass(true)}>
                  {DAMAGE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className={uiFormLabel}>
              Pen <span className="text-red-500">*</span>
            </label>
            <input type="text" inputMode="numeric" value={pen} onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
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

        <p className={uiSectionHeader}>Rules and Qualities</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <WeaponQualitySelector selected={selectedQualities} onChange={setSelectedQualities} />
            <div className="col-span-2">
              <label className={uiFormLabel}>
                Rules
              </label>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className={editableTextareaClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}
