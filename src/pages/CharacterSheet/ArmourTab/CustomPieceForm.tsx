import { useRef, useState } from "react";
import type {
  ArmourCraftsmanship,
  ArmourLocationKey,
  ArmourQuality,
  WornArmourPiece,
} from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
  uiInfoModalWrapper,
} from "../../../ui/styles/editableStyles";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { Chip } from "../../../ui/chips/Chip";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { PickerField } from "../../../ui/pickers/PickerField";
import { RequiredFormLabel } from "../../../ui/forms/RequiredFormLabel";
import { InfoModal } from "../../../components/InfoModal";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import { STANDARD_AVAILABILITY_OPTIONS } from "../../../constants/availability";
import { sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";
import {
  colourToggleSelectedRed,
  colourToggleSelectedAmberSoft,
} from "../../../ui/styles/colourTokens";

const WORN_ARMOUR_QUALITY_OPTIONS: ArmourQuality[] = [
  "Primitive",
  "Flak",
  "Mesh",
  "Sanctified",
  "Powered",
];

interface Props {
  initialPiece?: Partial<WornArmourPiece>;
  title?: string;
  submitLabel?: string;
  forceField?: boolean;
  onAdd: (piece: WornArmourPiece) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomPieceForm({
  initialPiece,
  title = "Custom Piece",
  submitLabel = "Add",
  forceField = false,
  onAdd,
  onCancel,
}: Props) {
  const formScrollPositionRef = useRef(0);
  const [name, setName] = useState(initialPiece?.name ?? "");
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialPiece?.source === "Custom" || initialPiece?.source === "2nd Ed"
      ? initialPiece.source
      : ""
  );
  const [craftsmanship, setCraftsmanship] = useState<ArmourCraftsmanship>(
    initialPiece?.craftsmanship ?? "Common"
  );
  const [ap, setAp] = useState(initialPiece?.ap !== undefined ? String(initialPiece.ap) : "");
  const [weight, setWeight] = useState(initialPiece?.weight ?? "");
  const [value, setValue] = useState(initialPiece?.value ?? "");
  const [availability, setAvailability] = useState(initialPiece?.availability ?? "");
  const [selectedLocs, setSelectedLocs] = useState<Set<ArmourLocationKey>>(
    new Set(initialPiece?.locations ?? [])
  );
  const [selectedQualities, setSelectedQualities] = useState<Set<ArmourQuality>>(
    new Set(initialPiece?.qualities ?? [])
  );
  const [notes, setNotes] = useState(initialPiece?.notes ?? "");
  const [protectionRating, setProtectionRating] = useState(
    initialPiece?.protectionRating !== undefined ? String(initialPiece.protectionRating) : ""
  );
  const [saving, setSaving] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);

  const canAdd =
    Boolean(name.trim()) &&
    Boolean(origin) &&
    (forceField ? protectionRating.trim() !== "" : selectedLocs.size > 0 && ap.trim() !== "") &&
    Boolean(weight.trim()) &&
    Boolean(value.trim()) &&
    Boolean(availability);

  function toggleQuality(q: ArmourQuality) {
    setSelectedQualities((prev) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  }

  function toggleLoc(loc: ArmourLocationKey) {
    setSelectedLocs((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  }

  async function handleAdd() {
    if (!canAdd || !origin) return;
    const piece: WornArmourPiece = {
      id: initialPiece?.id ?? crypto.randomUUID(),
      name: name.trim(),
      locations: forceField ? [] : [...selectedLocs],
      ap: forceField ? 0 : Number(ap) || 0,
      worn: initialPiece?.worn ?? true,
      craftsmanship,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      source: origin,
      qualities: forceField
        ? ["Overload"]
        : selectedQualities.size > 0
          ? [...selectedQualities]
          : undefined,
      notes: notes.trim() || undefined,
      custom: true,
      ...(forceField
        ? { isForceField: true, protectionRating: Number(protectionRating) || 0 }
        : {}),
      customLibraryId: initialPiece?.customLibraryId,
      customLibraryVersionId: initialPiece?.customLibraryVersionId,
    };
    setSaving(true);
    try {
      await onAdd(piece);
    } finally {
      setSaving(false);
    }
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
      onSubmit={handleAdd}
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div>
          <RequiredFormLabel htmlFor="custom-armour-name">Name</RequiredFormLabel>
          <input
            id="custom-armour-name"
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={forceField ? "e.g. Refraction Field" : "e.g. Flak Jacket"}
            className={editableInputClass(true) + " mt-0.5"}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector name="custom-armour-origin" value={origin} onChange={setOrigin} hideLabel />
      </CustomFormSection>

      <CustomFormSection title="Craftsmanship">
        <fieldset aria-required="true" className="space-y-1">
          <RequiredFormLabel as="legend">Craftsmanship</RequiredFormLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {CRAFTSMANSHIP_OPTIONS.map((option) => (
              <ToggleButton
                key={option}
                selected={craftsmanship === option}
                selectedClassName={CRAFTSMANSHIP_STYLE[option]}
                className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5"
                onClick={() => setCraftsmanship(option)}
              >
                {option}
              </ToggleButton>
            ))}
          </div>
        </fieldset>
      </CustomFormSection>

      <CustomFormSection title="Stats">
        {!forceField && (
          <fieldset aria-required="true" className="space-y-1">
            <RequiredFormLabel as="legend">Locations</RequiredFormLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  "leftArm",
                  "head",
                  "rightArm",
                  "leftLeg",
                  "body",
                  "rightLeg",
                ] as ArmourLocationKey[]
              ).map((loc) => (
                <ToggleButton
                  key={loc}
                  selected={selectedLocs.has(loc)}
                  selectedClassName={colourToggleSelectedRed}
                  className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5"
                  onClick={() => toggleLoc(loc)}
                >
                  {ARMOUR_LOCATION_LABELS[loc]}
                </ToggleButton>
              ))}
            </div>
          </fieldset>
        )}

        {forceField ? (
          <div>
            <RequiredFormLabel htmlFor="custom-armour-protection-rating">
              Protection Rating
            </RequiredFormLabel>
            <input
              id="custom-armour-protection-rating"
              required
              type="text"
              inputMode="numeric"
              value={protectionRating}
              onChange={(e) => setProtectionRating(sanitizeNonNegativeIntegerInput(e.target.value))}
              placeholder="0"
              className={editableInputClass(true) + " mt-0.5 w-24 font-code"}
              autoComplete="off"
            />
          </div>
        ) : (
          <div>
            <RequiredFormLabel htmlFor="custom-armour-ap">AP</RequiredFormLabel>
            <input
              id="custom-armour-ap"
              required
              type="text"
              inputMode="numeric"
              value={ap}
              onChange={(e) => setAp(sanitizeNonNegativeIntegerInput(e.target.value))}
              placeholder="0"
              className={editableInputClass(true) + " mt-0.5 w-24 font-code"}
              autoComplete="off"
            />
          </div>
        )}
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor="custom-armour-weight">Weight</RequiredFormLabel>
            <input
              id="custom-armour-weight"
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(sanitizeWeightInput(e.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-armour-cost">Cost</RequiredFormLabel>
            <input
              id="custom-armour-cost"
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(sanitizeMoneyInput(e.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
            />
          </div>
          <PickerField
            id="custom-armour-availability"
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
        <div
          className="space-y-1"
          role={forceField ? undefined : "group"}
          aria-labelledby={forceField ? undefined : "custom-armour-qualities-label"}
        >
          <p id="custom-armour-qualities-label" className={`${uiFormLabel} block mb-1.5`}>
            Qualities
          </p>
          {forceField ? (
            <div className="flex items-center gap-1.5">
              <Chip colour="amber" className="w-fit">
                Overload
              </Chip>
              <span className={uiInfoModalWrapper}>
                <InfoModal title="Overload" content={ARMOUR_SPECIAL_RULES.Overload} />
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {WORN_ARMOUR_QUALITY_OPTIONS.map((q) => (
                <ToggleButton
                  key={q}
                  selected={selectedQualities.has(q)}
                  selectedClassName={colourToggleSelectedAmberSoft}
                  className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5"
                  onClick={() => toggleQuality(q)}
                >
                  {q}
                </ToggleButton>
              ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="custom-armour-rules" className={uiFormLabel}>
            Rules
          </label>
          <textarea
            id="custom-armour-rules"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special rules or effects…"
            rows={3}
            className={editableTextareaClass(true) + " mt-0.5"}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
