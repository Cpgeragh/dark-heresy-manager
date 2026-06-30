import { useState } from "react";
import type { ArmourCraftsmanship, ArmourLocationKey, ArmourQuality, WornArmourPiece } from "../../../types/Character";
import { editableInputClass, uiSection, uiSectionHeader, uiFormLabel } from "../../../ui/editableStyles";
import { uiPickerBackButton } from "../../../ui/buttonStyles";
import { Button } from "../../../ui/Button";
import { PickerModal } from "../../../ui/PickerModal";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { CUSTOM_AVAILABILITY_OPTIONS, sanitizeNonNegativeIntegerInput } from "../weapons/weaponShared";
import { LOCATION_LABELS } from "./armourHelpers";

const ARMOUR_CRAFTSMANSHIP_OPTIONS: ArmourCraftsmanship[] = ["Poor", "Common", "Good", "Best"];
const ARMOUR_QUALITY_OPTIONS: ArmourQuality[] = ["Primitive", "Flak", "Mesh", "Sanctified", "Powered"];
const ARMOUR_CRAFTSMANSHIP_STYLE: Record<ArmourCraftsmanship, string> = {
  Poor: "border-red-500/70 bg-red-500/15 text-red-300",
  Common: "border-slate-500 bg-slate-800 text-slate-200",
  Good: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
  Best: "border-amber-400 bg-amber-500/20 text-amber-300",
};

interface Props {
  initialPiece?: Partial<WornArmourPiece>;
  title?: string;
  submitLabel?: string;
  onAdd: (piece: WornArmourPiece) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomPieceForm({
  initialPiece,
  title = "Custom Piece",
  submitLabel = "Add",
  onAdd,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialPiece?.name ?? "");
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
  const [saving, setSaving] = useState(false);

  const canAdd =
    Boolean(name.trim()) &&
    selectedLocs.size > 0 &&
    ap.trim() !== "" &&
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
    if (!canAdd) return;
    const piece: WornArmourPiece = {
      id: initialPiece?.id ?? crypto.randomUUID(),
      name: name.trim(),
      locations: [...selectedLocs],
      ap: Number(ap) || 0,
      worn: initialPiece?.worn ?? true,
      craftsmanship,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      qualities: selectedQualities.size > 0 ? [...selectedQualities] : undefined,
      custom: true,
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
            <Button className="flex-1" onClick={handleAdd} disabled={!canAdd || saving}>
              {saving ? "Saving..." : submitLabel}
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
          <div>
            <label className={uiFormLabel}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Flak Jacket"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>

        <p className={uiSectionHeader}>Craftsmanship</p>
        <div className={uiSection + " space-y-3"}>
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Craftsmanship <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ARMOUR_CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCraftsmanship(option)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    craftsmanship === option
                      ? ARMOUR_CRAFTSMANSHIP_STYLE[option]
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
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Qualities
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ARMOUR_QUALITY_OPTIONS.map((q) => (
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
          </div>

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
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose availability</option>
                {CUSTOM_AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}
