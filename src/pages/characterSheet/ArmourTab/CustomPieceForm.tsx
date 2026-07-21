import { useRef, useState } from "react";
import type { ArmourCraftsmanship, ArmourLocationKey, ArmourQuality, WornArmourPiece } from "../../../types/Character";
import { editableInputClass, editableTextareaClass, uiSection, uiSectionHeader, uiFormLabel, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { PickerBody, PickerModal } from "../../../ui/PickerModal";
import { OptionPickerScreen } from "../../../ui/OptionPickerScreen";
import { ArrowRight } from "../../../ui/PickerArrows";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { sourceColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { colourAmberFaint } from "../../../ui/colourTokens";
import { CRAFTSMANSHIP_OPTIONS, CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { InfoModal } from "../../../components/InfoModal";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import { CUSTOM_AVAILABILITY_OPTIONS, sanitizeNonNegativeIntegerInput } from "../weapons/weaponShared";
import { LOCATION_LABELS } from "./armourHelpers";

const WORN_ARMOUR_QUALITY_OPTIONS: ArmourQuality[] = ["Primitive", "Flak", "Mesh", "Sanctified", "Powered"];
const CUSTOM_ARMOUR_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

function isCustomArmourOrigin(value: string | undefined): value is (typeof CUSTOM_ARMOUR_ORIGIN_OPTIONS)[number] {
  return CUSTOM_ARMOUR_ORIGIN_OPTIONS.includes(value as (typeof CUSTOM_ARMOUR_ORIGIN_OPTIONS)[number]);
}

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
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_ARMOUR_ORIGIN_OPTIONS)[number]>(
    isCustomArmourOrigin(initialPiece?.source) ? initialPiece.source : ""
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
      qualities: forceField ? ["Overload"] : selectedQualities.size > 0 ? [...selectedQualities] : undefined,
      notes: notes.trim() || undefined,
      custom: true,
      ...(forceField ? { isForceField: true, protectionRating: Number(protectionRating) || 0 } : {}),
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
      scrollPositionRef={formScrollPositionRef}
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
            <Button className="flex-1" onClick={handleAdd} disabled={!canAdd || saving}>
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
          <div>
            <label className={uiFormLabel}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={forceField ? "e.g. Refraction Field" : "e.g. Flak Jacket"}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_ARMOUR_ORIGIN_OPTIONS.map((option) => (
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

        <p className={uiSectionHeader}>Craftsmanship</p>
        <div className={uiSection + " space-y-3"}>
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Craftsmanship <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
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
          </div>
        </div>

        <p className={uiSectionHeader}>Stats</p>
        <div className={uiSection + " space-y-3"}>
          {!forceField && (
            <div className="space-y-1">
              <label className={uiFormLabel}>
                Locations <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["leftArm", "head", "rightArm", "leftLeg", "body", "rightLeg"] as ArmourLocationKey[]).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLoc(loc)}
                    className={[
                      "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                      selectedLocs.has(loc)
                        ? "border-red-600 bg-red-600/20 text-red-400"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                    ].join(" ")}
                  >
                    {LOCATION_LABELS[loc]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {forceField ? (
            <div>
              <label className={uiFormLabel}>
                Protection Rating <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={protectionRating}
                onChange={(e) => setProtectionRating(sanitizeNonNegativeIntegerInput(e.target.value))}
                placeholder="0"
                className={editableInputClass(true) + " mt-0.5 w-24 font-code"}
              />
            </div>
          ) : (
            <div>
              <label className={uiFormLabel}>
                AP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={ap}
                onChange={(e) => setAp(sanitizeNonNegativeIntegerInput(e.target.value))}
                placeholder="0"
                className={editableInputClass(true) + " mt-0.5 w-24 font-code"}
              />
            </div>
          )}
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
                onChange={(e) => setWeight(sanitizeWeightInput(e.target.value))}
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
                onChange={(e) => setValue(sanitizeMoneyInput(e.target.value))}
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
          <div className="space-y-1">
            <label className={`${uiFormLabel} block mb-1.5`}>
              Qualities
            </label>
            {forceField ? (
              <div className="flex items-center gap-1.5">
                <Chip className={`w-fit ${colourAmberFaint}`}>Overload</Chip>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title="Overload" content={ARMOUR_SPECIAL_RULES.Overload} />
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {WORN_ARMOUR_QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleQuality(q)}
                    className={[
                      "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                      selectedQualities.has(q)
                        ? "border-amber-600 bg-amber-600/20 text-amber-400"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                    ].join(" ")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={uiFormLabel}>
              Rules
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special rules or effects…"
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
