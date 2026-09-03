// src/pages/CharacterSheet/CyberneticsTab/CustomImplantForm.tsx

import { useRef, useState } from "react";
import type {
  ArmourLocationKey,
  CyberneticCraftsmanship,
  CyberneticItem,
} from "../../../types/Character";
import { editableInputClass, editableTextareaClass, uiFormLabel } from "../../../ui/styles/editableStyles";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { CRAFTSMANSHIP_STYLE, CYBERNETIC_CRAFTSMANSHIP_OPTIONS } from "../../../ui/styles/craftsmanship";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { PickerField } from "../../../ui/pickers/PickerField";
import { RequiredFormLabel } from "../../../ui/forms/RequiredFormLabel";
import { EXTENDED_AVAILABILITY_OPTIONS } from "../../../constants/availability";

interface Props {
  initialItem?: Partial<CyberneticItem>;
  title?: string;
  submitLabel?: string;
  includeLocation?: boolean;
  onAdd: (item: CyberneticItem) => void | Promise<void>;
  onCancel: () => void;
}

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
  const formScrollPositionRef = useRef(0);
  const [name, setName] = useState(initialItem?.name ?? "");
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship | "">(
    initialItem?.craftsmanship ?? ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialItem?.source === "Custom" || initialItem?.source === "2nd Ed" ? initialItem.source : ""
  );
  const [availability, setAvailability] = useState(initialItem?.availability ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [locationIndex, setLocationIndex] = useState(
    String(findLocationOptionIndex(initialItem?.bodyLocation))
  );
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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

  if (showAvailabilityPicker) {
    return (
      <OptionPickerScreen
        title="Availability"
        options={EXTENDED_AVAILABILITY_OPTIONS}
        selected={availability}
        onSelect={(value) => {
          setAvailability(value);
          setShowAvailabilityPicker(false);
        }}
        onClose={() => setShowAvailabilityPicker(false)}
      />
    );
  }

  if (showLocationPicker) {
    return (
      <OptionPickerScreen
        title="Installation"
        options={LOCATION_OPTIONS.map((option, index) => ({
          value: String(index),
          label: option.label,
        }))}
        selected={locationIndex}
        onSelect={(value) => {
          setLocationIndex(value);
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
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
      onSubmit={addImplant}
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-cybernetic-name">Name</RequiredFormLabel>
            <input
              id="custom-cybernetic-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Cybernetic name..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <fieldset aria-required="true" className="col-span-2">
            <RequiredFormLabel as="legend">Craftsmanship</RequiredFormLabel>
            <div className="mt-0.5 grid grid-cols-3 gap-1.5">
              {CYBERNETIC_CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={craftsmanship === option}
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
          </fieldset>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector
          name="custom-cybernetic-origin"
          value={origin}
          onChange={setOrigin}
          hideLabel
        />
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-cybernetic-cost">Cost</RequiredFormLabel>
            <input
              id="custom-cybernetic-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id="custom-cybernetic-availability"
            label="Availability"
            value={availability}
            placeholder="Choose availability"
            required
            onClick={() => setShowAvailabilityPicker(true)}
          />
          {includeLocation && (
            <PickerField
              id="custom-cybernetic-installation"
              label="Installation"
              value={LOCATION_OPTIONS[Number(locationIndex)]?.label}
              placeholder="Not specified"
              onClick={() => setShowLocationPicker(true)}
              className="col-span-2"
            />
          )}
        </div>
      </CustomFormSection>

      <CustomFormSection title="Rules">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label htmlFor="custom-cybernetic-rules" className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id="custom-cybernetic-rules"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Implant rules, effects, drawbacks..."
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}

function findLocationOptionIndex(location?: ArmourLocationKey[]) {
  if (!location?.length) return 0;
  return Math.max(
    0,
    LOCATION_OPTIONS.findIndex(
      (option) =>
        option.value?.length === location.length &&
        option.value.every((value, index) => value === location[index])
    )
  );
}
