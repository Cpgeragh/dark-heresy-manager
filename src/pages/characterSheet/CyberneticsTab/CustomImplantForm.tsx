// src/pages/characterSheet/CyberneticsTab/CustomImplantForm.tsx

import { useState } from "react";
import type {
  ArmourLocationKey,
  CyberneticCraftsmanship,
  CyberneticItem,
} from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
} from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { PickerModal } from "../../../ui/PickerModal";
import { sourceColour } from "../../../ui/sourceStyles";
import { CRAFTSMANSHIP_ORDER, CRAFTSMANSHIP_STYLE } from "./cyberneticsConstants";

interface Props {
  initialItem?: Partial<CyberneticItem>;
  title?: string;
  submitLabel?: string;
  includeLocation?: boolean;
  onAdd: (item: CyberneticItem) => void | Promise<void>;
  onCancel: () => void;
}

const CUSTOM_IMPLANT_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

const CUSTOM_IMPLANT_AVAILABILITY_OPTIONS = [
  "Abundant",
  "Plentiful",
  "Common",
  "Average",
  "Uncommon",
  "Scarce",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Near Unique",
  "Unique",
  "Issued Only",
  "Adeptus Mechanicus Only",
] as const;

const LOCATION_OPTIONS: Array<{ label: string; value?: ArmourLocationKey[] }> = [
  { label: "Not specified" },
  { label: "Head", value: ["head"] },
  { label: "Body", value: ["body"] },
  { label: "Left Arm", value: ["leftArm"] },
  { label: "Right Arm", value: ["rightArm"] },
  { label: "Both Arms", value: ["leftArm", "rightArm"] },
  { label: "Left Leg", value: ["leftLeg"] },
  { label: "Right Leg", value: ["rightLeg"] },
  { label: "Both Legs", value: ["leftLeg", "rightLeg"] },
];

export function CustomImplantForm({
  initialItem,
  title = "Custom Cybernetic",
  submitLabel = "Add",
  includeLocation = true,
  onAdd,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship | "">(
    initialItem?.craftsmanship ?? ""
  );
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_IMPLANT_ORIGIN_OPTIONS)[number]>(
    initialItem?.source === "Custom" || initialItem?.source === "2nd Ed" ? initialItem.source : ""
  );
  const [availability, setAvailability] = useState(initialItem?.availability ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [locationIndex, setLocationIndex] = useState(
    String(findLocationOptionIndex(initialItem?.bodyLocation))
  );
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const selectedLocation = LOCATION_OPTIONS[Number(locationIndex)]?.value;
  const canAdd =
    Boolean(name.trim()) &&
    Boolean(craftsmanship) &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(value);

  const addImplant = async () => {
    if (!canAdd || !craftsmanship || !origin) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialItem?.id ?? crypto.randomUUID(),
        name: name.trim(),
        craftsmanship,
        value: formatMoneyInput(value),
        availability,
        source: origin,
        notes: notes.trim() || undefined,
        customLibraryId: initialItem?.customLibraryId,
        customLibraryVersionId: initialItem?.customLibraryVersionId,
        ...(includeLocation && selectedLocation ? { bodyLocation: selectedLocation } : {}),
      });
    } finally {
      setSaving(false);
    }
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
            <p className="text-xs lg:text-sm text-slate-300">
              <span className="text-red-500">*</span> Required
            </p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={addImplant} disabled={!canAdd || saving}>
              {saving ? "Saving..." : submitLabel}
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
                placeholder="Cybernetic name..."
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Craftsmanship <span className="text-red-500">*</span>
              </label>
              <div className="mt-0.5 grid grid-cols-3 gap-1.5">
                {CRAFTSMANSHIP_ORDER.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCraftsmanship(option)}
                    className={[
                      "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                      craftsmanship === option
                        ? `${CRAFTSMANSHIP_STYLE[option]} font-semibold`
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_IMPLANT_ORIGIN_OPTIONS.map((option) => (
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
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Availability <span className="text-red-500">*</span>
              </label>
              <select
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose availability</option>
                {CUSTOM_IMPLANT_AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {includeLocation && (
              <div className="col-span-2">
                <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                  Installation
                </label>
                <select
                  value={locationIndex}
                  onChange={(event) => setLocationIndex(event.target.value)}
                  className={editableInputClass(true) + " mt-0.5"}
                >
                  {LOCATION_OPTIONS.map((option, index) => (
                    <option key={option.label} value={String(index)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Implant rules, effects, drawbacks..."
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

function findLocationOptionIndex(location?: ArmourLocationKey[]) {
  if (!location?.length) return 0;
  return Math.max(
    0,
    LOCATION_OPTIONS.findIndex((option) =>
      option.value?.length === location.length &&
      option.value.every((value, index) => value === location[index])
    )
  );
}
