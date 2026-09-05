import { useState } from "react";
import type { PsychicPower } from "../../../types/Character";
import {
  PSYCHIC_DISCIPLINES,
  type PsychicDiscipline,
} from "../../../data/reference/psychicReference";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { Button } from "../../../ui/buttons/Button";
import { Chip } from "../../../ui/chips/Chip";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { PickerBody, PickerModal } from "../../../ui/pickers/PickerModal";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
} from "../../../ui/styles/editableStyles";
import { disciplineColours } from "./psychicStyles";
import { normalisePowerName } from "./psychicPowerHelpers";

type PowerGroup = "minor" | "major";
type CustomRangeMode = "meters" | "km-radius" | "you" | "unlimited";

function rangeToFormValue(range?: string): { mode: CustomRangeMode; value: string } {
  if (range === "You") return { mode: "you", value: "" };
  if (range === "Unlimited") return { mode: "unlimited", value: "" };

  const kmMatch = range?.match(/^([1-9]\d*(?:\.\d)?) km radius$/);
  if (kmMatch) return { mode: "km-radius", value: kmMatch[1] };

  const metresMatch = range?.match(/^([1-9]\d*)m$/);
  if (metresMatch) return { mode: "meters", value: metresMatch[1] };

  return { mode: "meters", value: "" };
}

export function CustomPowerForm({
  target,
  existingNames,
  initialPower,
  onAdd,
  onBack,
  onCancel,
  requiredDiscipline,
}: {
  target: PowerGroup;
  existingNames: Set<string>;
  initialPower?: PsychicPower;
  onAdd: (power: PsychicPower) => void | Promise<void>;
  onBack: () => void;
  onCancel: () => void;
  requiredDiscipline?: string;
}) {
  const majorDisciplines = PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor");
  const initialRange = rangeToFormValue(initialPower?.range);
  const [name, setName] = useState(initialPower?.name ?? "");
  const [description, setDescription] = useState(initialPower?.description ?? "");
  const [discipline, setDiscipline] = useState<PsychicDiscipline | "">(
    target === "minor"
      ? "Minor"
      : ((requiredDiscipline as PsychicDiscipline | undefined) ??
          (initialPower?.discipline as PsychicDiscipline | undefined) ??
          "")
  );
  const [threshold, setThreshold] = useState(initialPower?.threshold ?? "");
  const [focusTime, setFocusTime] = useState<"" | "Half Action" | "Full Action">(
    initialPower?.focusTime === "Half Action" || initialPower?.focusTime === "Full Action"
      ? initialPower.focusTime
      : ""
  );
  const [rangeMode, setRangeMode] = useState<CustomRangeMode>(initialRange.mode);
  const [rangeValue, setRangeValue] = useState(initialRange.value);
  const [sustained, setSustained] = useState<"" | "Yes" | "No">(
    initialPower?.sustained === "Yes" || initialPower?.sustained === "No"
      ? initialPower.sustained
      : ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialPower?.origin === "2nd Ed" ? "2nd Ed" : initialPower ? "Custom" : ""
  );
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const initialName = initialPower?.name.trim() ?? "";
  const nameKey = normalisePowerName(trimmedName);
  const initialNameKey = normalisePowerName(initialName);
  const nameExists = nameKey !== initialNameKey && existingNames.has(nameKey);
  const thresholdIsValid = /^[1-9]\d*$/.test(threshold);
  const metresRangeIsValid = /^[1-9]\d*$/.test(rangeValue);
  const kmRangeIsValid = /^[1-9]\d*(?:\.\d)?$/.test(rangeValue);
  const rangeValueIsValid =
    rangeMode === "you" ||
    rangeMode === "unlimited" ||
    (rangeMode === "km-radius" ? kmRangeIsValid : metresRangeIsValid);
  const canAdd =
    !!trimmedName &&
    !nameExists &&
    !!discipline &&
    thresholdIsValid &&
    !!focusTime &&
    rangeValueIsValid &&
    !!sustained &&
    !!origin;

  function handlePositiveIntegerChange(value: string, setter: (next: string) => void) {
    if (value === "" || /^[1-9]\d*$/.test(value)) setter(value);
  }

  function handlePositiveKmChange(value: string) {
    if (value === "" || /^[1-9]\d*(?:\.\d?)?$/.test(value)) setRangeValue(value);
  }

  function formatRange() {
    if (rangeMode === "you") return "You";
    if (rangeMode === "unlimited") return "Unlimited";
    if (rangeMode === "km-radius") return `${rangeValue} km radius`;
    return `${rangeValue}m`;
  }

  async function handleAdd() {
    if (!canAdd || saving) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialPower?.id ?? crypto.randomUUID(),
        name: trimmedName,
        discipline,
        threshold,
        focusTime,
        range: formatRange(),
        sustained,
        origin: origin as CustomItemOrigin,
        description: description.trim() || undefined,
        isMinor: target === "minor",
        custom: true,
        known: initialPower?.known ?? true,
        talentEntryUid: initialPower?.talentEntryUid,
        psyRatingTalentEntryUid: initialPower?.psyRatingTalentEntryUid,
        customLibraryId: initialPower?.customLibraryId,
        customLibraryVersionId: initialPower?.customLibraryVersionId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PickerModal
      title={`${initialPower ? "Edit" : "Custom"} ${target === "minor" ? "Minor" : "Major"} Power`}
      query=""
      onQueryChange={() => undefined}
      onClose={initialPower ? onCancel : onBack}
      closeLabel={initialPower ? undefined : <ArrowLeft />}
      closeAriaLabel={initialPower ? "Close" : "Back"}
      hideSearch
      isEmpty={false}
    >
      <PickerBody>
        <div className="space-y-1">
          <label className={uiFormLabel}>
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Power name..."
            className={editableInputClass(true)}
            autoFocus
          />
          {nameExists && (
            <p className="text-xs lg:text-sm text-red-300">
              That power is already on this character.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Discipline <span className="text-red-400">*</span>
          </label>
          {target === "minor" || requiredDiscipline ? (
            <Chip
              className={`w-fit ${disciplineColours[target === "minor" ? "Minor" : (requiredDiscipline ?? "")] ?? disciplineColours.default}`}
            >
              {target === "minor" ? "Minor" : requiredDiscipline}
            </Chip>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {majorDisciplines.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d)}
                  className={[
                    "text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    discipline === d
                      ? `${disciplineColours[d] ?? disciplineColours.default} font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={uiFormLabel}>
              PT <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => handlePositiveIntegerChange(e.target.value, setThreshold)}
              placeholder="e.g. 8"
              className={editableInputClass(true) + " font-code"}
            />
          </div>

          <div className="space-y-1">
            <label className={uiFormLabel}>
              Action <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Half Action", "Full Action"] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setFocusTime(action)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    focusTime === action
                      ? "border-red-500 bg-red-500/20 text-red-400 font-semibold"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {action.replace(" Action", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Range <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              ["meters", "Metres"],
              ["km-radius", "km radius"],
              ["you", "You"],
              ["unlimited", "Unlimited"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRangeMode(mode as CustomRangeMode)}
                className={[
                  "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                  rangeMode === mode
                    ? "border-red-500 bg-red-500/20 text-red-400 font-semibold"
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          {(rangeMode === "meters" || rangeMode === "km-radius") && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                inputMode={rangeMode === "km-radius" ? "decimal" : "numeric"}
                value={rangeValue}
                onChange={(e) =>
                  rangeMode === "km-radius"
                    ? handlePositiveKmChange(e.target.value)
                    : handlePositiveIntegerChange(e.target.value, setRangeValue)
                }
                placeholder={rangeMode === "km-radius" ? "e.g. 1.5" : "e.g. 10"}
                className={editableInputClass(true) + " w-28 font-code"}
              />
              <span className="text-xs lg:text-sm text-slate-400">
                {rangeMode === "km-radius" ? "km radius" : "metres"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Sustained <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Yes", "No"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSustained(value)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    sustained === value
                      ? "border-red-500 bg-red-500/20 text-red-400 font-semibold"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <OriginSelector name="custom-power-origin" value={origin} onChange={setOrigin} />
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Description <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rules text, notes, overbleed..."
            rows={4}
            className={editableTextareaClass(true)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleAdd} disabled={!canAdd || saving}>
            {saving ? "Saving..." : initialPower ? "Save Power" : "Add Power"}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
