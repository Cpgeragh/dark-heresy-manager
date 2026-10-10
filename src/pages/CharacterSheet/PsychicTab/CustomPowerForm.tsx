import { useState } from "react";
import type { PsychicPower } from "../../../types/Character";
import {
  PSYCHIC_DISCIPLINES,
  type PsychicDiscipline,
} from "../../../data/reference/psychicReference";
import type { CustomItemOrigin } from "../../../constants/customItems";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { Chip } from "../../../ui/chips/Chip";
import { OriginSelector } from "../../../ui/forms/OriginSelector";
import { RequiredMark } from "../../../ui/forms/RequiredMark";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { PickerBody, PickerModal } from "../../../ui/pickers/PickerModal";
import {
  uiChipRow,
  uiInlineRow,
  uiFieldGrid,
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
  uiTextError,
  uiFormLabelHint,
  uiTextMeta,
} from "../../../ui/styles/editableStyles";
import { chipColours, colourToggleSelectedRed } from "../../../ui/styles/colourTokens";
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
            Name <RequiredMark />
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Power name..."
            className={editableInputClass(true)}
            autoFocus
            autoComplete="off"
          />
          {nameExists && (
            <p className={`text-xs lg:text-sm ${uiTextError}`}>
              That power is already on this character.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Discipline <RequiredMark />
          </label>
          {target === "minor" || requiredDiscipline ? (
            <Chip
              colour={
                disciplineColours[target === "minor" ? "Minor" : (requiredDiscipline ?? "")] ??
                disciplineColours.default
              }
              className="w-fit"
            >
              {target === "minor" ? "Minor" : requiredDiscipline}
            </Chip>
          ) : (
            <div className={`${uiChipRow}`}>
              {majorDisciplines.map((d) => (
                <ToggleButton
                  key={d}
                  selected={discipline === d}
                  selectedClassName={`${chipColours[disciplineColours[d] ?? disciplineColours.default]} font-semibold`}
                  className="text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5"
                  onClick={() => setDiscipline(d)}
                >
                  {d}
                </ToggleButton>
              ))}
            </div>
          )}
        </div>

        <div className={`${uiFieldGrid}`}>
          <div className="space-y-1">
            <label className={uiFormLabel}>
              PT <RequiredMark />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => handlePositiveIntegerChange(e.target.value, setThreshold)}
              placeholder="e.g. 8"
              className={editableInputClass(true) + " font-code"}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className={uiFormLabel}>
              Action <RequiredMark />
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Half Action", "Full Action"] as const).map((action) => (
                <ToggleButton
                  key={action}
                  selected={focusTime === action}
                  selectedClassName={colourToggleSelectedRed}
                  className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5"
                  onClick={() => setFocusTime(action)}
                >
                  {action.replace(" Action", "")}
                </ToggleButton>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Range <RequiredMark />
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              ["meters", "Metres"],
              ["km-radius", "km radius"],
              ["you", "You"],
              ["unlimited", "Unlimited"],
            ].map(([mode, label]) => (
              <ToggleButton
                key={mode}
                selected={rangeMode === mode}
                selectedClassName={colourToggleSelectedRed}
                className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5"
                onClick={() => setRangeMode(mode as CustomRangeMode)}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
          {(rangeMode === "meters" || rangeMode === "km-radius") && (
            <div className={`${uiInlineRow} pt-1`}>
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
                autoComplete="off"
              />
              <span className={uiTextMeta}>
                {rangeMode === "km-radius" ? "km radius" : "metres"}
              </span>
            </div>
          )}
        </div>

        <div className={`${uiFieldGrid}`}>
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Sustained <RequiredMark />
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Yes", "No"] as const).map((value) => (
                <ToggleButton
                  key={value}
                  selected={sustained === value}
                  selectedClassName={colourToggleSelectedRed}
                  className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5"
                  onClick={() => setSustained(value)}
                >
                  {value}
                </ToggleButton>
              ))}
            </div>
          </div>

          <OriginSelector name="custom-power-origin" value={origin} onChange={setOrigin} />
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Description <span className={uiFormLabelHint}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rules text, notes, overbleed..."
            rows={4}
            className={editableTextareaClass(true)}
            autoComplete="off"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1"
            onClick={handleAdd}
            disabled={!canAdd}
            loading={saving}
            loadingLabel="Saving"
          >
            {initialPower ? "Save Power" : "Add Power"}
          </Button>
          <Button variant="neutral" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
