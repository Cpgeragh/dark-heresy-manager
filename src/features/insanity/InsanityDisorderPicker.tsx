import { useState } from "react";
import type { InsanityDisorderEntry, InsanityDisorderSeverity } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { OptionPickerScreen } from "../../ui/OptionPickerScreen";
import { ArrowRight, ArrowLeft } from "../../ui/PickerArrows";
import { uiPickerBackButton } from "../../ui/buttonStyles";
import { editableInputClass, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextBody, uiTextLabel } from "../../ui/editableStyles";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import { INSANITY_DISORDER_REFERENCE, INSANITY_SEVERITIES, type InsanityDisorderRef } from "./insanityReference";
import { disorderTypeChipClass, inactiveChipClass, severityChipClass } from "./insanityUi";

function createDisorderId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `disorder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const customDisorderTypes = [
  ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))).sort(),
  "Other",
];

const allSeverityOptions: InsanityDisorderSeverity[] = ["Minor", "Severe", "Acute"];
const severeSeverityOptions: InsanityDisorderSeverity[] = ["Severe", "Acute"];

function customSeverityOptionsFor(type: string): InsanityDisorderSeverity[] {
  if (type === "The Flesh is Weak") return severeSeverityOptions;
  if (type === "Horrific Nightmares") return ["Minor", "Severe"];
  return allSeverityOptions;
}

export function InsanityDisorderPicker({
  existingReferenceIds,
  onAdd,
  onClose,
}: {
  existingReferenceIds: Set<string>;
  onAdd: (entry: InsanityDisorderEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<InsanityDisorderRef | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customType, setCustomType] = useState(customDisorderTypes[0]);
  const [severity, setSeverity] = useState<InsanityDisorderSeverity>("Minor");
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showTypeFilterPicker, setShowTypeFilterPicker] = useState(false);

  const typeOptions = [
    "All",
    ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))).sort(),
  ];
  const filtered = INSANITY_DISORDER_REFERENCE.filter((ref) => {
    const searchable = `${ref.type} ${ref.name}`.toLowerCase();
    return (
      !ref.custom &&
      !existingReferenceIds.has(ref.id) &&
      (typeFilter === "All" || ref.type === typeFilter) &&
      searchable.includes(query.trim().toLowerCase())
    );
  }).sort((a, b) => a.name.localeCompare(b.name));

  const activeSeverity = selected?.severityOptions.includes(severity)
    ? severity
    : selected?.severityOptions[0] ?? "Minor";
  const customSeverityOptions = customSeverityOptionsFor(customType);
  const activeCustomSeverity = customSeverityOptions.includes(severity)
    ? severity
    : customSeverityOptions[0];
  const activeSeverityDescription =
    INSANITY_SEVERITIES.find((entry) => entry.severity === activeSeverity)?.description ?? "";
  const canAddCustom = Boolean(customName.trim());

  if (showTypePicker) {
    return (
      <OptionPickerScreen
        title="Type"
        options={customDisorderTypes}
        selected={customType}
        onSelect={(value) => {
          setCustomType(value);
          setShowTypePicker(false);
        }}
        onClose={() => setShowTypePicker(false)}
      />
    );
  }
  if (showTypeFilterPicker) {
    return (
      <OptionPickerScreen
        title="Disorder Type"
        options={typeOptions.map((type) => (type === "All" ? "All Disorder Types" : type))}
        selected={typeFilter === "All" ? "All Disorder Types" : typeFilter}
        onSelect={(value) => {
          setTypeFilter(value === "All Disorder Types" ? "All" : value);
          setShowTypeFilterPicker(false);
        }}
        onClose={() => setShowTypeFilterPicker(false)}
      />
    );
  }

  if (customMode) {
    return (
      <PickerModal
        title="Custom Disorder"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setCustomMode(false)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <div className="space-y-2">
            {!canAddCustom && (
              <p className="text-xs lg:text-sm text-slate-300"><span className="text-red-500">*</span> Required</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCustomMode(false)} className={uiPickerBackButton}>
                Back
              </button>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  if (!canAddCustom) return;
                  onAdd({
                    id: createDisorderId(),
                    type: customType,
                    name: customName.trim(),
                    severity: activeCustomSeverity,
                    notes: notes.trim() || undefined,
                    custom: true,
                  });
                  setCustomMode(false);
                  setCustomType(customDisorderTypes[0]);
                  setSeverity("Minor");
                  setCustomName("");
                  setNotes("");
                }}
                disabled={!canAddCustom}
                className="flex-1"
              >
                Add Disorder
              </Button>
            </div>
          </div>
        }
      >
        <PickerBody>
          <div>
            <p className={uiFormLabel}>Type <span className="text-red-500">*</span></p>
            <button
              type="button"
              onClick={() => setShowTypePicker(true)}
              className="mt-1 w-full rounded border border-slate-500 bg-slate-900 px-2 py-1.5 text-sm lg:text-base text-slate-200 text-left flex items-center justify-between"
            >
              <span>{customType}</span>
              <ArrowRight />
            </button>
          </div>

          <div>
            <label className={uiFormLabel}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the disorder…"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <div>
            <p className={uiFormLabel}>Severity <span className="text-red-500">*</span></p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {customSeverityOptions.map((option) => (
                <Chip
                  key={option}
                  as="button"
                  type="button"
                  onClick={() => setSeverity(option)}
                  className={activeCustomSeverity === option ? severityChipClass[option] : inactiveChipClass}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </div>

          <FormField
            label="Notes"
            value={notes}
            onChange={setNotes}
            editable
            type="textarea"
            rows={3}
            placeholder="Optional details…"
          />
        </PickerBody>
      </PickerModal>
    );
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        query=""
        onQueryChange={() => undefined}
        onClose={() => setSelected(null)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              onAdd({
                id: createDisorderId(),
                referenceId: selected.id,
                type: selected.type,
                name: selected.name,
                severity: activeSeverity,
              });
              setSelected(null);
            }}
          >
            Add Disorder
          </Button>
        }
      >
        <PickerBody>
          <div>
            <p className={`${uiFormLabel} mb-2 text-center normal-case !text-[15px] lg:!text-base`}>Choose Severity</p>
            <div className="flex gap-2">
              {selected.severityOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSeverity(option)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    activeSeverity === option
                      ? severityChipClass[option]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {activeSeverityDescription && (
            <div className={`text-center text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
              {activeSeverityDescription}
            </div>
          )}
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title="Add Disorder"
      placeholder="Search disorders..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      filterRow={
        <button
          type="button"
          onClick={() => setShowTypeFilterPicker(true)}
          className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between"
        >
          <span>{typeFilter === "All" ? "All Disorder Types" : typeFilter}</span>
          <ArrowRight />
        </button>
      }
      footer={
        <PickerCustomAction
          onClick={() => {
            setCustomMode(true);
            setSelected(null);
            setCustomType(customDisorderTypes[0]);
            setSeverity("Minor");
            setCustomName("");
            setNotes("");
          }}
        >
          + Add custom disorder
        </PickerCustomAction>
      }
    >
      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          onClick={() => {
            setSelected(ref);
            setSeverity(ref.severityOptions[0]);
            setCustomName("");
            setNotes("");
          }}
        >
          <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip size="sm" className={disorderTypeChipClass(ref.type)}>{ref.type}</Chip>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={ref.name}
                content={
                  <DisorderInfoContent
                    type={ref.type}
                    name={ref.name}
                    description={ref.description}
                    typeDescription={ref.typeDescription}
                  />
                }
                as="span"
              />
            </span>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
